import argparse
import csv
import os

def generate_chart(csv_file, x_column, y_column, output_html , theme):
    # Read data from the CSV file
    x_data = []
    y_data = []
    with open(csv_file, 'r', encoding='utf-8') as file:  # Specify UTF-8 encoding
        reader = csv.DictReader(file)
        for row in reader:
            x_data.append(row[x_column])
            y_data.append(float(row[y_column]))  # Ensure numeric data for Chart.js


    template_path = os.path.join(os.path.dirname(__file__), 'chart_template.html')

    with open(template_path, 'r', encoding='utf-8') as template_file:
        html_template = template_file.read()

    # Inject data into the template
    html_content = html_template.replace('{{ x_data }}', str(x_data))
    html_content = html_content.replace('{{ y_data }}', str(y_data))
    html_content = html_content.replace('{{ x_label }}', x_column)
    html_content = html_content.replace('{{ y_label }}', y_column)
    html_content = html_content.replace('{{ theme }}', theme)  # Inject theme
    # Save the final HTML
    with open(output_html, 'w', encoding='utf-8') as output_file:  # Specify UTF-8 encoding
        output_file.write(html_content)
    print(output_html)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a Chart.js line graph from a CSV file.")
    parser.add_argument("csv_file", help="Path to the CSV file")
    parser.add_argument("x_column", help="Column name to be used for the X-axis")
    parser.add_argument("y_column", help="Column name to be used for the Y-axis")
    parser.add_argument("theme", help="Default Theme to be used for the chart")
    args = parser.parse_args()

    output_file = os.path.splitext(args.csv_file)[0] + "_chart.html" 

    try:
        generate_chart(args.csv_file, args.x_column, args.y_column, output_file, args.theme)
    except Exception as e:
        print(f"An error occurred: {e}")
        exit(1)
