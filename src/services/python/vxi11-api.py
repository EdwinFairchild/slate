import ctypes
import uuid
import os
import json
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

if __name__ == "__main__":
    # Example: scan subnet 10.0.0.x
    devices = scan_lxi_devices("10.0.0")
    print(json.dumps(devices))
