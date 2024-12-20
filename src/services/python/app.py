#!/usr/bin/env python
import pyvisa as visa
import time
# need to catch VisaIOError
class Oscilloscope(object):
    """A class for simplifying communication with Siglent oscilloscopes."""
    def __init__(self):
        self.delay = 0.01
        self.rm = visa.ResourceManager()

    def list_devices(self):
        """List all available VISA resources."""
        resources = self.rm.list_resources()
        print("Detected Resources:", resources)
        
        # Filter for Siglent oscilloscopes connected via USB or LAN (TCPIP)
        self.siglent_list = [res for res in resources if "USB" in res or "TCPIP" in res]
        
        if self.siglent_list:
            print("Available Siglent Oscilloscopes:")
            for idx, resource in enumerate(self.siglent_list):
                print(f"ID: {idx} - Resource: {resource}")
        else:
            print("No Siglent oscilloscopes found.")

            
            
    def connect(self, instrument=None):
        """Connect to an oscilloscope. Use list_devices to find the instrument."""
        if instrument is None:
            print("No instrument specified.")
            return

        if isinstance(instrument, int):  # If an index is passed, get the corresponding resource
            try:
                instrument = self.siglent_list[instrument]
            except IndexError:
                print(f"Invalid instrument ID: {instrument}")
                return

        try:
            print(f"Connecting to oscilloscope using resource: {instrument}")
            self.osc = self.rm.open_resource(instrument)
            print("Connected successfully.")
        except Exception as e:
            print(f"Error connecting to oscilloscope: {e}")
                
    def disconnect(self):
        """Close the resource manager connection."""
        self.rm.close()
    
    def measure_vpp(self, channel):
        """Measure peak-to-peak voltage for specified channel."""
        query_results = self.osc.query('C{0}:PAVA? PKPK'.format(str(channel)))
        time.sleep(self.delay)
        print(Oscilloscope.format_results(query_results))
        
    def measure_vmax(self, channel):
        """Measure maximum voltage for specified channel."""
        query_results = self.osc.query('C{0}:PAVA? MAX'.format(str(channel)))
        time.sleep(self.delay)
        print(Oscilloscope.format_results(query_results))

    def measure_rms(self, channel):
        """Measure RMS voltage for specified channel."""
        query_results = self.osc.query('C{0}:PAVA? RMS'.format(str(channel)))
        time.sleep(self.delay)
        print(Oscilloscope.format_results(query_results))

    def measure_freq(self, channel):
        """Measure frequency for specified channel."""
        query_results = self.osc.query('C{0}:PAVA? FREQ'.format(str(channel)))
        time.sleep(self.delay)
        print(Oscilloscope.format_results(query_results))

    def measure_period(self, channel):
        """Measure period for specified channel."""
        query_results = self.osc.query('C{0}:PAVA? PER'.format(str(channel)))
        time.sleep(self.delay)
        print(Oscilloscope.format_results(query_results))

    def set_vdiv(self, channel, value):
        """Sets voltage division for specified channel.
            Accepted values: 2mV, 5mV, 10mV, 20mV, 50mV, 100mV, 200mV, 500mV, 1V, 2V, 5V,
            (also 10V if not CFL series)"""
        
        if value in ('2mV', '5mV', '10mV', '20mV', '50mV', '100mV', '200mV', '500mV', '1V', '2V', '5V', '10V'):
            try:
                self.osc.write('C{0}:VDIV {1}'.format(str(channel), value.upper()))
                print("Success. Voltage division set to {0}.".format(value))
            except:
                print("Failed to set specified voltage division.")
        else:
            print("Invalid voltage division value.")

    def set_tdiv(self, channel, value):
        """Sets time division for specified channel.
            Accepted values: 5ns, 10ns, 25ns, 50ns, 100ns, 250ns, 500ns, 1us, 2.5us, 5us,
           10us, 25us, 50us, 100us, 250us, 500us, 1ms, 2.5ms, 5ms, 10ms, 25ms, 50ms, 100ms,
           250ms, 500ms, 1s, 2.5s, 5s, 10s, 25s, 50s"""
        
        if value in ('5ns', '10ns', '25ns', '50ns', '100ns', '250ns', '500ns', '1us', '2.5us', '5us', '10us', '25us',
                     '50us', '100us', '250us', '500us', '1ms', '2.5ms', '5ms', '10ms', '25ms', '50ms', '100ms', '250ms',
                     '500ms', '1s', '2.5s', '5s', '10s', '25s', '50s'):# 1ns and 2.5ns can be added (applicable for certain models of oscilloscope)
            try:
                self.osc.write('C{0}:TDIV {1}'.format(str(channel), value.upper()))
                print("Success. Time division set to {0}.".format(value))
            except:
                print("Failed to set specified time division.")
        else:
            print("Invalid time division value.")

    @staticmethod
    def format_results(query_results):
        return query_results.split(',')[1]

if __name__ == '__main__':
    print("This script is currently designed to be imported, but may also be run inside of an interactive IDE like IDLE.")