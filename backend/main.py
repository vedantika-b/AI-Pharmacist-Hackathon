import pandas as pd

# CSV read
medicine_df = pd.read_csv("../data/products-export.csv")
orders_df = pd.read_csv("../data/Consumer Order History.csv")

# Example print
print("Medicines available:")
print(medicine_df.head())

print("Order history:")
print(orders_df.head())
