import argparse
import csv
import os

def generate_chart(csv_file, x_column, y_column):
    # Read data from the CSV file
    x_data = []
    y_data = []
    with open(csv_file, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            x_data.append(row[x_column])
            y_data.append(row[y_column])
    
    # Generate HTML content
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <title>Line Chart</title>
</head>
<body>
    <div style="width: 80%; margin: auto;">
        <canvas id="lineChart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('lineChart').getContext('2d');
        const chart = new Chart(ctx, {{
            type: 'line',
            data: {{
                labels: {x_data},
                datasets: [{{
                    label: '{y_column} vs {x_column}',
                    data: {y_data},
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false
                }}]
            }},
            options: {{
                responsive: true,
                plugins: {{
                    legend: {{
                        position: 'top',
                    }},
                    title: {{
                        display: true,
                        text: '{y_column} vs {x_column}'
                    }}
                }}
            }}
        }});
    </script>
</body>
</html>
"""
    # Write the HTML content to a file
    output_file = os.path.splitext(csv_file)[0] + "_chart.html"
    with open(output_file, 'w') as file:
        file.write(html_content)
    
    # print the path of the output file only
    print(output_file)
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a Chart.js line graph from a CSV file.")
    parser.add_argument("csv_file", help="Path to the CSV file")
    parser.add_argument("x_column", help="Column name to be used for the X-axis")
    parser.add_argument("y_column", help="Column name to be used for the Y-axis")
    args = parser.parse_args()
    
    generate_chart(args.csv_file, args.x_column, args.y_column)
