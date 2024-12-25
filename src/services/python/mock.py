import csv
import math

# Constants
num_rows = 1000
voltage_min = 0
voltage_max = 5
num_periods = 2

# Generate sinusoidal data
data = []
for i in range(num_rows):
    index = i
    voltage = (voltage_max - voltage_min) / 2 * (1 + math.sin(2 * math.pi * num_periods * i / num_rows))
    data.append([index, voltage])

# Write data to CSV file
with open('sinusoidal_data.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['index', 'voltage'])
    writer.writerows(data)

print("CSV file 'sinusoidal_data.csv' generated successfully.")