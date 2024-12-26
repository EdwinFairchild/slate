import vxi11
import uuid
import os
import json
import sys
import time
import csv
import threading

def scan_lxi_devices(subnet):
    """
    Scan the given subnet for LXI devices using the liblxi.so library.
    Returns a list of devices with id, name, address, type, and isConnected.
    """
    ## returns IP
    instr = vxi11.list_devices()
    devices = []
    for device in instr:
        try:
            dev = vxi11.Instrument(device)
            response = dev.ask("*IDN?")
            devices.append((device, response))
        except Exception as e:
            devices.append((device, str(e)))
    #[('10.0.0.150', 'Siglent Technologies,SDS3034X HD,SDS3HA0Q800623,4.8.9.1.0.3.9'), ('10.0.0.207', 'Siglent Technologies,SDM3055,SDM35GBQ4R0653,1.01.01.20R2')]
    response  = []
    # itterate thourgh devices
    for device in devices:
        device_id = str(uuid.uuid4())  # Generate a unique ID for each device
        response.append({
            "id": device_id,
            "name": device[1].split(",")[1],
            "address" : device[0],
            "type" : "Unknown",
            "isConnected" : False,

            })
    return response

def send_scpi_command(device_address, command):
    """
    Send an SCPI command to the device at the given address.
    Returns the response from the device.
    """
    response = "NA"
    try:
        dev = vxi11.Instrument(device_address)
        dev.timeout = 1.5 # TODO: Make this configurable
        response = dev.ask(command)
        return response
    except Exception as e:
        return "No response"

def handle_test_data(test_data, device_ip,output_dir):
    """
    Handles the test data, executes commands, creates a CSV log, and returns a JSON response.
    """
    # Generate a unique test ID (if needed)
    test_id = f"{str(uuid.uuid4())[:8]}"

    sys.stdout.flush()  # Ensure the output is sent to the Electron app
    timestamp = int(time.time())
    test_name = test_data.get("name", "unnamed_test").replace(" ", "_")
    duration = test_data.get("duration", 0) * 60  # Convert duration from minutes to seconds
    interval = test_data.get("interval", 0) / 1000.0  # Convert interval from ms to seconds
    commands = test_data.get("commands", [])
    
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
            csv_writer.writerow(['Timestamp', 'Command', 'Response', 'Error'])

            # Start test execution
            start_time = time.time()
            command_status = {}

            while time.time() - start_time < duration:
                for command in commands:
                    cmd_text = command.get("command", "")
                    run_once = command.get("runOnce", False)
                    wait_after = command.get("waitAfter", 0) / 1000.0  # Convert ms to seconds
                    
                    # Skip commands that are marked as runOnce and have already been executed
                    if run_once and command_status.get(cmd_text, False):
                        continue
                    
                    try:
                        # Send SCPI command
                        response = send_scpi_command(device_ip, cmd_text)
                        if response == "No response":
                            continue
                        csv_writer.writerow([time.strftime('%H:%M:%S'), cmd_text, response, ""])
                        command_status[cmd_text] = True  # Mark as executed
                    except Exception as e:
                        # Log errors to the CSV
                        csv_writer.writerow([time.strftime('%Y-%m-%d %H:%M:%S'), cmd_text, "", str(e)])

                    #Wait after the command execution
                    if wait_after > 0:
                        time.sleep(wait_after) 
                
                #Wait for the specified interval before the next iteration
                if interval > 0:
                    time.sleep(interval)

            return {
                "status": "success",
                "log_file_path": csv_file_path
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def handle_test_thread(test_data, device_ip):
    """
    Runs a test in a separate thread.
    """
    test_id = test_data.get("name", "unnamed_test") + "_" + str(uuid.uuid4())
    result = handle_test_data(test_data, device_ip)
    
    # Remove the test from active tests after completion
    if test_id in active_tests:
        del active_tests[test_id]

    print(f"Test {test_id} completed with result: {result}")


def start_test(test_data, device_ip):
    """
    Starts a new test in a separate thread.
    """
    test_id = test_data.get("name", "unnamed_test") + "_" + str(uuid.uuid4())
    
    # Create and start a new thread for the test
    test_thread = threading.Thread(target=handle_test_thread, args=(test_data, device_ip))
    test_thread.daemon = True  # Ensures the thread will not block program exit
    active_tests[test_id] = test_thread
    test_thread.start()

    return {
        "status": "success",
        "test_id": test_id,
        "message": f"Test {test_id} started successfully"
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
            response = send_scpi_command(ip, command)
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
