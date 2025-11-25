import os
def borrar_ultima_linea():
    try:
        this_file      = os.path.abspath(__file__)
        funcionalidades = os.path.dirname(this_file)
        proyecto       = os.path.dirname(funcionalidades)
        backups_dir    = os.path.join(proyecto, 'backups')
        archivo        = os.path.join(backups_dir, 'IpUserPassword.txt')

        # 1. Abrir el archivo en modo lectura
        with open(archivo, 'r', encoding='utf-8') as f:
            lineas = f.readlines()  # Lee todas las líneas y las guarda en una lista

        if not lineas:
            print("[!] El archivo está vacío, no hay nada que borrar.")
            return

        # 2. Eliminar la última línea
        lineas.pop()  # Elimina el último elemento de la lista

        # 3. Escribir las líneas restantes de nuevo en el archivo
        with open(archivo, 'w', encoding='utf-8') as f:
            f.writelines(lineas)  # Escribe todas las líneas (ya sin la última)

        print("[✔] Última línea eliminada correctamente.")

    except FileNotFoundError:
        print("[!] Archivo no encontrado.")
    except Exception as e:
        print(f"[!] Error inesperado: {e}")


