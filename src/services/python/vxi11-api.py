import ctypes
import uuid
import os
import json
import sys
import time
import csv
import threading

# Dictionary to keep track of active test threads
active_tests = {}
# Load the shared library
# Get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load the shared library using an absolute path
lib_path = os.path.join(current_dir, "liblxi.so.1.0.0")
lxi = ctypes.CDLL(lib_path)
# Define discovery constants
DISCOVER_VXI11 = 0

# Define the structure for the discovery info
class LxiInfo(ctypes.Structure):
    _fields_ = [
        ("broadcast", ctypes.CFUNCTYPE(None, ctypes.c_char_p, ctypes.c_char_p)),
        ("device", ctypes.CFUNCTYPE(None, ctypes.c_char_p, ctypes.c_char_p)),
    ]

# Python callbacks to handle discovered devices
discovered_devices = []

def broadcast_callback(address, interface):
    pass
    #print(f"Broadcasting on interface: {interface.decode()}")

def device_callback(address, idn):
    device_id = str(uuid.uuid4())  # Generate a unique ID for each device
    idn_decoded = idn.decode()
    address_decoded = address.decode()
    discovered_devices.append({
        "id": device_id,
        "name": idn_decoded.split(",")[1] if len(idn_decoded.split(",")) > 1 else "Unknown Device",
        "address": address_decoded,
        "type": idn_decoded.split(",")[0] if len(idn_decoded.split(",")) > 0 else "Unknown Type",
        "isConnected": False,  # Default connection status
    })
    #print(f"Found device: {idn_decoded} at {address_decoded}")

# Convert Python callbacks to C function pointers
BroadcastCallback = ctypes.CFUNCTYPE(None, ctypes.c_char_p, ctypes.c_char_p)
DeviceCallback = ctypes.CFUNCTYPE(None, ctypes.c_char_p, ctypes.c_char_p)

def scan_lxi_devices(subnet):
    """
    Scan the given subnet for LXI devices using the liblxi.so library.
    Returns a list of devices with id, name, address, type, and isConnected.
    """
    global discovered_devices
    discovered_devices = []  # Clear the global list for fresh scan

    # Initialize the LXI library
    lxi.lxi_init()

    # Prepare the discovery info structure
    info = LxiInfo(
        broadcast=BroadcastCallback(broadcast_callback),
        device=DeviceCallback(device_callback),
    )

    # Perform the discovery
    timeout = 1000  # 1-second timeout in milliseconds
    #print(f"Scanning subnet {subnet}.x for LXI devices...")
    lxi.lxi_discover(ctypes.byref(info), timeout, DISCOVER_VXI11)

    # Return the discovered devices
    #print(f"Found {len(discovered_devices)} devices.")
    return discovered_devices

def send_scpi_command(device_address, command):
    """
    Send an SCPI command to the device at the given address.
    Returns the response from the device.
    """
    timeout = 3000  # Timeout in milliseconds
    response_size = 65536  # Maximum response size

    # Initialize the LXI library
    if lxi.lxi_init() != 0:
        raise RuntimeError("Failed to initialize the LXI library")

    # Connect to the device
    device = lxi.lxi_connect(device_address.encode('utf-8'), 0, None, timeout, 0)  # Using VXI-11 protocol
    if device < 0:
        raise RuntimeError(f"Failed to connect to device at {device_address}")

    try:
        # Send the SCPI command
        if lxi.lxi_send(device, command.encode('utf-8'), len(command), timeout) < 0:
            raise RuntimeError(f"Failed to send command: {command}")

        # Receive the response
        response_buffer = ctypes.create_string_buffer(response_size)
        received_size = lxi.lxi_receive(device, response_buffer, response_size, timeout)
        if received_size < 0:
            raise RuntimeError("Failed to receive response from the device")

        # Decode and return the response
        return response_buffer.value.decode('utf-8')

    finally:
        # Disconnect from the device
        lxi.lxi_disconnect(device)


def handle_test_data(test_data, device_ip):
    """
    Handles the test data, executes commands, creates a CSV log, and returns a JSON response.
    """
    timestamp = int(time.time())
    test_name = test_data.get("name", "unnamed_test").replace(" ", "_")
    duration = test_data.get("duration", 0) * 60  # Convert duration from minutes to seconds
    interval = test_data.get("interval", 0) / 1000.0  # Convert interval from ms to seconds
    commands = test_data.get("commands", [])
    
    # Generate a unique CSV file for logging
    file_name = f"{test_name}_{timestamp}.csv"
    csv_file_path = os.path.join(current_dir, file_name)

    try:
        with open(csv_file_path, mode='w', newline='') as csv_file:
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
                        csv_writer.writerow([time.strftime('%Y-%m-%d %H:%M:%S'), cmd_text, response, ""])
                        command_status[cmd_text] = True  # Mark as executed
                    except Exception as e:
                        # Log errors to the CSV
                        csv_writer.writerow([time.strftime('%Y-%m-%d %H:%M:%S'), cmd_text, "", str(e)])

                    # Wait after the command execution
                    if wait_after > 0:
                        time.sleep(wait_after)
                
                # Wait for the specified interval before the next iteration
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

            if test_index >= len(sys.argv) or ip_index >= len(sys.argv):
                print(json.dumps({"error": "Missing test data or device IP argument"}))
                sys.exit(1)

            test_data_json = sys.argv[test_index]
            device_ip = sys.argv[ip_index]
            try:
                test_data = json.loads(test_data_json)
                result = handle_test_data(test_data, device_ip)
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
