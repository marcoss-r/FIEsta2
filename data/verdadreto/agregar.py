#!/usr/bin/env python3
"""Da de alta verdades o retos nuevos en "Verdad o Reto" (vr) desde consola.

Uso: python3 data/verdadreto/agregar.py

Lee y escribe verdades.json/retos.json (fuente) y regenera verdades.js y
retos.js a partir de ellos. No editar los .js a mano: se pierde en la
siguiente ejecución de este script.
"""
import json
import re
import sys
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
NIVELES = ("suave", "picante", "extremo")
BANCOS = {
    "verdad": {"json": CARPETA / "verdades.json", "js": CARPETA / "verdades.js", "const": "VR_VERDADES"},
    "reto": {"json": CARPETA / "retos.json", "js": CARPETA / "retos.js", "const": "VR_RETOS"},
}


def cargar(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def guardar(ruta, datos):
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
        f.write("\n")


def regenerar_js(ruta_js, nombre_const, datos):
    lineas = [
        f"// Banco de {'verdades' if nombre_const == 'VR_VERDADES' else 'retos'} de \"Verdad o Reto\" (vr).",
        "// Generado desde el .json correspondiente — no editar a mano (usar agregar.py).",
        f"const {nombre_const} = [",
    ]
    for nivel in NIVELES:
        del_nivel = [d for d in datos if d["nivel"] == nivel]
        if not del_nivel:
            continue
        lineas.append(f"  // ── {nivel}")
        for entrada in del_nivel:
            texto = entrada["texto"].replace('"', '\\"')
            lineas.append(f'  {{ texto: "{texto}", nivel: "{nivel}" }},')
        lineas.append("")
    while lineas and lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    ruta_js.write_text("\n".join(lineas) + "\n", encoding="utf-8")


def avisos(texto, tipo):
    encontrados = []
    if "{otro2}" in texto and "{otro}" not in texto:
        pass  # combinación válida, nada que avisar
    if tipo == "verdad":
        if not texto.startswith("¿") and not re.search(r"¿.+\?", texto):
            encontrados.append("no parece llevar «¿…?»: revisa que sea una pregunta completa")
    else:
        if texto[:1].islower():
            encontrados.append("empieza en minúscula: los retos empiezan en mayúscula")
    palabras = texto.split()
    for palabra in palabras[1:]:
        limpia = re.sub(r"^[^\wáéíóúñ]+", "", palabra, flags=re.IGNORECASE)
        if limpia[:1].isupper() and limpia.upper() != limpia:
            encontrados.append(
                f"la palabra «{palabra}» empieza en mayúscula: ¿es un nombre propio colado por error?"
            )
    return encontrados


def pedir_tipo():
    while True:
        tipo = input("¿Verdad o reto? (verdad/reto): ").strip().lower()
        if tipo in BANCOS:
            return tipo
        print("Debe ser «verdad» o «reto».")


def pedir_texto(datos, tipo):
    while True:
        texto = input("Texto: ").strip()
        if not texto:
            print("El texto no puede estar vacío.")
            continue
        if any(d["texto"] == texto for d in datos):
            print("Ya existe una entrada idéntica en el banco. No se añade.")
            continue
        lista_avisos = avisos(texto, tipo)
        for aviso in lista_avisos:
            print(f"  ⚠️  Aviso: {aviso}")
        if lista_avisos:
            confirmar = input("¿Añadir de todas formas? (s/N): ").strip().lower()
            if confirmar != "s":
                continue
        return texto


def pedir_nivel():
    while True:
        nivel = input(f"Nivel ({'/'.join(NIVELES)}): ").strip().lower()
        if nivel in NIVELES:
            return nivel
        print(f"Nivel no válido. Debe ser uno de: {', '.join(NIVELES)}.")


def main():
    cache = {tipo: cargar(info["json"]) for tipo, info in BANCOS.items()}
    print(f"Verdades: {len(cache['verdad'])} · Retos: {len(cache['reto'])}")
    try:
        while True:
            tipo = pedir_tipo()
            texto = pedir_texto(cache[tipo], tipo)
            nivel = pedir_nivel()
            cache[tipo].append({"texto": texto, "nivel": nivel})
            guardar(BANCOS[tipo]["json"], cache[tipo])
            regenerar_js(BANCOS[tipo]["js"], BANCOS[tipo]["const"], cache[tipo])
            print(f"Añadida. {tipo.capitalize()}s ahora: {len(cache[tipo])}.")
            otra = input("¿Añadir otra? (S/n): ").strip().lower()
            if otra == "n":
                break
    except (KeyboardInterrupt, EOFError):
        print("\nInterrumpido. Lo añadido hasta ahora ya está guardado.")
    print("verdades.js y retos.js regenerados.")


if __name__ == "__main__":
    sys.exit(main())
