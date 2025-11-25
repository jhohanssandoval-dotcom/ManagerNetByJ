from ping3 import ping, errors
import time

def ping_host(host):
    count = 4
    timeout = 2
    interval = 0.5
    latency_times = []
    packets_sent = 0
    packets_received = 0

    print(f"Pinging {host} with ping3...")

    for i in range(count):
        packets_sent += 1
        try:
            delay = ping(host, timeout=timeout, unit='ms')  # delay puede ser float o None
            if delay is not None and delay is not False:
                latency_times.append(delay)
                packets_received += 1
                print(f"  Reply from {host}: time={delay:.2f} ms")
            else:
                print(f"  Request timed out or unreachable for {host} (packet {i+1})")
        except errors.PingError as e:
            print(f"  Ping error for {host} (packet {i+1}): {e}")
        except Exception as e:
            print(f"  An unexpected error occurred for {host} (packet {i+1}): {e}")
        
        if i < count - 1:
            time.sleep(interval)

    packet_loss_percent = ((packets_sent - packets_received) / packets_sent) * 100 if packets_sent > 0 else 0

    # Solo calcular min, avg y max si hay datos válidos
    if latency_times:
        min_rtt = min(latency_times)
        avg_rtt = sum(latency_times) / len(latency_times)
        max_rtt = max(latency_times)
    else:
        min_rtt = avg_rtt = max_rtt = None

    return {
        'host': host,
        'packets_sent': packets_sent,
        'packets_received': packets_received,
        'packet_loss_percent': packet_loss_percent,
        'latency_times': latency_times,
        'min_rtt': min_rtt,
        'avg_rtt': avg_rtt,
        'max_rtt': max_rtt,
    }


#hosts_to_ping = ['google.com', '192.168.1.1', '8.8.8.8', 'localhost']
#for host in hosts_to_ping:
#    print(ping_host_library(host))
