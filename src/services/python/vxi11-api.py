import vxi11
import uuid
import os
import json
import sys
import time
import csv
import threading
import pyvisa
import uuid
import pyvisa

def scan_lxi_devices(subnet=None):
    """
    Scan for LXI devices using PyVISA and return a list of devices
    with id, name, address, type, and isConnected.
    """
    # Initialize Resource Manager
    rm = pyvisa.ResourceManager()
    
    devices = []
    try:
        # List available resources
        resources = rm.list_resources()
        
        
        try:
            device_list = [res for res in resources if "TCPIP" in res or "USB" in res]
            if device_list:
                for device_found in device_list:
                    # Open a session to the resource
                    instrument = rm.open_resource(device_found)
                    # Query the instrument for identification
                    response = instrument.query("*IDN?")
                    instrument.close()
                    # Parse the IDN response
                    idn_parts = response.split(",")
                    device_name = idn_parts[1] if len(idn_parts) > 1 else "Unknown"

                    # Add device to the list
                    devices.append({
                        "id": str(uuid.uuid4()),
                        "name": device_name,
                        "address": device_found,
                        "type": "Unknown",  # Type determination could be added here if needed
                        "isConnected": False  # Assume devices are not connected for now
                    })
        except Exception as e:
            # Add a placeholder for devices that failed to respond
            devices.append({
                "id": str(uuid.uuid4()),
                "name": "Unknown",
                "address": resource,
                "type": "Error",
                "isConnected": False,
                "error": str(e)
            })
    except Exception as e:
        print(f"Error while scanning devices: {e}")

    return devices


def send_scpi_command( device_address, command):
    """
    Send an SCPI command to the device at the given address.
    Returns the response from the device.
    """
    response = "NA"
    try:
        rm = pyvisa.ResourceManager()
        dev = rm.open_resource(device_address)
        # check if the scpi command is a command or query
        if "?" in command:
            # send query with long timeout so it has time to respond
            dev.timeout = 25000
            response = dev.query(command)
        else:
            # commands dont need a response
            dev.write(command)
        dev.close()
        return response
    except Exception as e:
        return "No response"

def handle_test_data(test_data, device_ip,output_dir):
    """
    Handles the test data, executes commands, creates a CSV log, and returns a JSON response.
    !!!!!!  print statements are used to send messages to the Electron app via stdout. !!!!!!!
    """
    # Generate a unique test ID (if needed)
    test_id = f"{str(uuid.uuid4())[:8]}"

    sys.stdout.flush()  # Ensure the output is sent to the Electron app
    timestamp = int(time.time())
    test_name = test_data.get("name", "unnamed_test").replace(" ", "_")
    duration = test_data.get("duration", 0) * 60  # Convert duration from minutes to seconds
    interval = test_data.get("interval", 0) / 1000.0  # Convert interval from ms to seconds
    commands = test_data.get("commands", [])
    first_column = test_data.get("firstCol", "Index")
    debugCount = 1
    
    # Generate a unique CSV file for logging
    file_name = f"{test_name}_{test_id}.csv"
    csv_file_path = os.path.join(output_dir, file_name)

    # Immediately send a response indicating that the test has started
    test_statusu = {
            "status": "running",
            "test_id": test_id,
            "log_file_path": str(csv_file_path)
        }
    print(json.dumps(test_statusu)) 
    sys.stdout.flush()  # Ensure the output is sent to the Electron app
    try:
        with open(csv_file_path, mode='w', newline='',buffering=1) as csv_file:
            csv_writer = csv.writer(csv_file)
            if first_column == "Timestamp":
                csv_writer.writerow(['Timestamp', 'Command', 'Response'])
            if first_column == "Index":
                csv_writer.writerow(['Index', 'Command', 'Response'])
            if first_column == "Both":
                csv_writer.writerow(['Index', 'Timestamp', 'Command', 'Response'])

            # Start test execution
            start_time = time.time()
            command_status = {}
            indexCount = 0
            newListLoopCommands = []
            while time.time() - start_time < duration:
               
                for command in commands:
                    cmd_text = command.get("command", "")
                    run_once = command.get("runOnce", False)
                    wait_after = command.get("waitAfter", 0) / 1000.0  # Convert ms to seconds
                    
                    print(f"Print 1 : RunOnce= {run_once} command = {cmd_text}");
                    try:
                        # Send SCPI command
                        response = send_scpi_command(device_ip, cmd_text)
                        if run_once:
                            commands.remove(command)
                        # skip commands that are not queries because they have no response
                        if "?" not in cmd_text:
                            continue
                        if first_column == "Timestamp":
                            csv_writer.writerow([time.strftime('%H:%M:%S'), cmd_text, response])
                        if first_column == "Index":
                            csv_writer.writerow([ indexCount , cmd_text, response])
                        if first_column == "Both":
                            csv_writer.writerow([indexCount,time.strftime('%H:%M:%S'), cmd_text, response])
                       
                        command_status[cmd_text] = True  # Mark as executed
                    except Exception as e:
                        # Log errors to the CSV
                        csv_writer.writerow([time.strftime('%Y-%m-%d %H:%M:%S'), cmd_text, str(e)])

                    #Wait after the command execution
                    if wait_after > 0:
                        time.sleep(wait_after) 
    
                    indexCount += 1
                                   
                #Wait for the specified interval before the next iteration
                if interval > 0:
                    time.sleep(interval)
                debugCount += 1

            return {
                "status": "success",
                "log_file_path": csv_file_path
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
def stop_test(test_id):
    """
    Stops the test with the given test_id.
    """
    if test_id in active_tests:
        # Attempt to stop the thread (requires cooperative cancellation in the thread logic)
        thread = active_tests[test_id]
        # Implement your cancellation logic here
        return {"status": "success", "message": f"Test {test_id} stopped successfully"}
    else:
        return {"status": "error", "message": f"Test {test_id} not found"}

        
if __name__ == "__main__":
    try:
        if "--ip" in sys.argv and "--command" in sys.argv:
            # Handle SCPI commands
            ip_index = sys.argv.index("--ip") + 1
            command_index = sys.argv.index("--command") + 1

            if ip_index >= len(sys.argv) or command_index >= len(sys.argv):
                print("Error: Missing arguments for --ip or --command")
                sys.exit(1)

            ip = sys.argv[ip_index]
            command = sys.argv[command_index]
            response = send_scpi_command(ip, command, False)
            print(response)  # Output response as plain text
        elif "--discover" in sys.argv:
            # Handle device discovery
            discover_index = sys.argv.index("--discover") + 1

            if discover_index >= len(sys.argv):
                print(json.dumps({"error": "Missing subnet argument for --discover"}))
                sys.exit(1)

            subnet = sys.argv[discover_index]
            devices = scan_lxi_devices(subnet)
            print(json.dumps(devices))  # Output devices as JSON
        elif "--start-test" in sys.argv:
            test_index = sys.argv.index("--start-test") + 1
            ip_index = sys.argv.index("--ip") + 1
            savedir_index = sys.argv.index("--savedir") + 1

            if test_index >= len(sys.argv) or ip_index >= len(sys.argv) or savedir_index >= len(sys.argv):
                print(json.dumps({"error": "Missing test data, device IP, or save directory argument"}))
                sys.exit(1)

            test_data_json = sys.argv[test_index]
            device_ip = sys.argv[ip_index]
            output_dir = sys.argv[savedir_index]
            try:
                test_data = json.loads(test_data_json)
                result = handle_test_data(test_data, device_ip, output_dir)
                print(json.dumps(result))  # Return the result as JSON
            except json.JSONDecodeError as e:
                print(json.dumps({"error": f"Invalid JSON format: {str(e)}"}))
                sys.exit(1)
       
        else:
            # Show usage instructions
            print("Usage:")
            print("  python3 vxi11-api.py --ip <device_ip> --command <command>")
            print("  python3 vxi11-api.py --discover <subnet>")
            print("  python3 vxi11-api.py --start-test <test_data_json>")
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
