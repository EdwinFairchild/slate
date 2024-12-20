from app import Oscilloscope

def main():
    scope = Oscilloscope()
    try:
        # List devices and select the first one
        scope.list_devices()
        # if scope.siglent_list:
        #     # Use the resource string of the first device
        #     scope.connect(scope.siglent_list[0])

        #     # Query the device
        #     print("Querying device identity:")
        #     response = scope.osc.query("*IDN?")
        #     print(f"Response: {response}")
        # else:
        #     print("No oscilloscopes found.")

        # # Query the frequency on Channel 1
        # response = scope.osc.query("C1:PAVA? FREQ")
        # print(f"Frequency: {response} Hz")

        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        scope.disconnect()

if __name__ == "__main__":
    main()