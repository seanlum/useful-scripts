# Required packages
# psutil, whois, and the native socket library

import psutil
import whois
import socket
import subprocess
import os
import sqlite3
import threading
import concurrent.futures
import time

output_dir = os.path.abspath('.' + os.path.sep + 'temp')
dbname = 'host-lookups.db'

db = {}

def database_connect():
  connect_path = os.path.abspath(f'{output_dir}{os.path.sep}{dbname}')
  # if ("instance" in db):
  #   if db["instance"] != None:
  #     return db["instance"]
  # db["instance"] = sqlite3.connect(connect_path)
  # return db["instance"]
  return sqlite3.connect(connect_path)

def database_disconnect():
  if "instance" in db:
    if db['instance'] != None:
      db['instance'].close()

def database_create_table_ifnot():
  db = database_connect()
  cursor = db.cursor()
  create_statement = '''
    CREATE TABLE IF NOT EXISTS ip_lookup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ipaddr TEXT UNIQUE,
      hostinfo TEXT,
      whois TEXT,
      ipinfo TEXT
    )
  '''
  cursor.execute(create_statement)
  db.commit()
  db.close()

def database_result_insert(ipaddr, hostinfo, whoisinfo, ipinfo):
  database_create_table_ifnot()
  db = database_connect()
  cursor = db.cursor()
  cursor.execute('''
    INSERT OR IGNORE INTO ip_lookup (ipaddr, hostinfo, whois, ipinfo)
    VALUES (?, ?, ?, ?)
  ''', (ipaddr, hostinfo, whoisinfo, ipinfo))
  db.commit()
  db.close()

def database_query_ip(ipaddr):
  database_create_table_ifnot()
  db = database_connect()
  cursor = db.cursor()
  cursor.execute('''
    SELECT COUNT(id) FROM ip_lookup WHERE ipaddr = ?
  ''', (ipaddr, ))
  result = cursor.fetchone()
  result = result[0]
  db.close()
  if result == 0:
    return False
  if result > 0:
    return True
  else:
    return False

  

def get_active_connections():
    """Fetch active remote connections on the system."""
    connections = psutil.net_connections(kind='inet')
    remote_ips = set()  # Use a set to avoid duplicate IPs

    print(f"{'Local Address':<30} {'Remote Address':<30} {'Status':<15}")
    print("=" * 75)

    for conn in connections:
        if conn.raddr:
            local = f"{conn.laddr.ip}:{conn.laddr.port}"
            remote = f"{conn.raddr.ip}:{conn.raddr.port}"
            status = conn.status
            remote_ips.add(conn.raddr.ip)

            print(f"{local:<30} {remote:<30} {status:<15}")
    
    return remote_ips

def run_powershell_command(command):
    """Runs a PowerShell command and returns the output."""
    try:
        # Execute the PowerShell command
        result = subprocess.run(
            ["powershell", "-Command", command],
            capture_output=True,
            text=True,
            check=False
        )
        if result.stderr == 'The requested name is valid, but no data of the requested type was found.\n':
          return None
        else:
          return result
    except subprocess.CalledProcessError as e:
        print(f"Error executing PowerShell command: {e}")
        return None

def host_run_lookup(ip, filename):
  try:
    return socket.gethostbyaddr(ip)
  except:
    return -1

def host_log_prepare(ip, hostdata):
  if hostdata == -1:
    return f"[{ip}] No host lookup data\n\r"
  else:
    # Host lookup data
    write_data = f"[{ip}] hostname: {hostdata[0]}\n\r"
    # Host aliases
    if len(hostdata[1]) > 0:
      for alias in hostdata[1]:
        write_data += f"[{ip}] alias: {alias}\n\r"
    else:
      write_data += f"[{ip}] aliases: N/A\n\r"
    # Host addresses
    if len(hostdata[2]) > 0:
      if len(hostdata[2]) == 1:
        write_data += f"[{ip}] address: {hostdata[2][0]}\n\r"
      else:
        for addr in hostdata[2]:
          write_data += f"[{ip}] address: {addr}\n\r"
    elif len(hostdata[2]) < 1:
      write_data += f"[{ip}] address: N/A\n\r"
    return write_data

def log_file_write(data, filename):
  with open(filename, 'w+') as filehandle:
    filehandle.write(str(data))

def whois_lookup_powershell(ip):
    """Performs WHOIS lookup using PowerShell."""
    exists = database_query_ip(ip)
    if exists:
      # print(f'Result found for {ip}')
      return       
    print(f"Scanning IP: {ip}")
    filename = ip.replace('.','-')
    filename = filename.replace(':','-')
    filename = output_dir + os.path.sep + filename + ".txt"
    hostlookup = host_run_lookup(ip, filename)
    hostdata = host_log_prepare(ip, hostlookup)
    if (hostlookup == -1):
      output_data = ''
    else:
      # print('Got host lookup information')
      output_data = hostdata + '\n\r'
    # log_file_write(hostdata, filename)
    command = f"whois {ip}"
    whoisinfo = run_powershell_command(command)
    whoisdata = ''
    if whoisinfo != None:
      # print('Found whois information')
      output_data += whoisinfo.stdout
      whoisdata = whoisinfo.stdout
    else:
      pass
      # print('Could not find whois information')
    command = f"curl ipinfo.io/{ip}"
    ipinfo = run_powershell_command(command)
    ipdata = ''
    if ipinfo != None:
      # print('Got ipinfo')
      output_data += output_data + '\n\r' + ipinfo.stdout
      ipdata = ipinfo.stdout
    else:
      pass  
      # print('Could not get ip info')
    database_result_insert(ip, hostdata, whoisdata, ipdata)
    print(f'{ip} added to database')
    # alog_file_write(output_data, filename)

def get_active_connections_events():
    """Poll network connections periodically."""
    remote_ips = set()
    while True:
        connections = psutil.net_connections(kind='inet')
        new_ips = set()  # To store only new IPs for this iteration
        for conn in connections:
            if conn.raddr:
                ip = conn.raddr.ip
                if ip not in remote_ips:
                    remote_ips.add(ip)  # Add to catalogued set
                    print(f"New connection from IP: {ip}")
        print('...')
        print("\nPerforming WHOIS lookups for remote IPs...")
        sorted_ips = list(remote_ips.copy())
        remote_ips = set()
        db = database_connect()
        cursor = db.cursor()
        sorted_ips.sort()
        cursor.execute("SELECT COUNT(id) FROM ip_lookup")
        rows = cursor.fetchone()
        firstcount = rows[0]
        print(f'{firstcount} IPs catalogued already')
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for ip in sorted_ips:
                futures.append(executor.submit(whois_lookup_powershell, ip))
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
            cursor.execute("SELECT COUNT(id) FROM ip_lookup")
            rows = cursor.fetchone()
            count = rows[0]
            print(f'{count} IPs catalogued now. {str(int(count) - int(firstcount))} new entries')
            remote_ips = set()
        db.close()
        time.sleep(10)



def main():
    print("Fetching active remote connections...")
    # remote_ips = get_active_connections()
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
      executor.submit(get_active_connections_events())
      

if __name__ == "__main__":
    main()