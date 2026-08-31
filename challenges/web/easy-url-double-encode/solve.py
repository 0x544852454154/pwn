import urllib.parse
raw = "%2570%2577%256e%257b%2575%2572%256c%255f%2533%256e%2574%2531%2574%2579%255f%2574%2572%2531%2570%256c%2533%255f%2564%2533%2563%2530%2564%2533%255f%2536%2536%2531%2532%257d"
s = raw
while "%" in s:
    s = urllib.parse.unquote(s)
print("Decoded Flag:", s)
