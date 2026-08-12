#!/usr/bin/env python3
"""Da de alta frases nuevas en el banco de "Yo nunca" (yn) desde consola.

Uso: python3 data/yonunca/agregar.py

Lee y escribe frases.json (fuente) y regenera frases.js a partir de él. No
editar frases.js a mano: se pierde en la siguiente ejecución de este script.
"""
import json
import re
import sys
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
RUTA_JSON = CARPETA / "frases.json"
RUTA_JS = CARPETA / "frases.js"
NIVELES = ("suave", "picante", "extremo")


def cargar():
    with open(RUTA_JSON, encoding="utf-8") as f:
        return json.load(f)


def guardar(frases):
    with open(RUTA_JSON, "w", encoding="utf-8") as f:
        json.dump(frases, f, ensure_ascii=False, indent=2)
        f.write("\n")


def regenerar_js(frases):
    lineas = [
        "// Banco de frases de \"Yo nunca\" (yn).",
        "// Generado desde frases.json — no editar a mano (usar agregar.py).",
        "const YN_FRASES = [",
    ]
    for nivel in NIVELES:
        del_nivel = [f for f in frases if f["nivel"] == nivel]
        if not del_nivel:
            continue
        lineas.append(f"  // ── {nivel}")
        for frase in del_nivel:
            texto = frase["texto"].replace('"', '\\"')
            lineas.append(f'  {{ texto: "{texto}", nivel: "{nivel}" }},')
        lineas.append("")
    while lineas and lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    RUTA_JS.write_text("\n".join(lineas) + "\n", encoding="utf-8")


def avisos(texto):
    """Devuelve una lista de avisos (no bloquean el alta, solo informan)."""
    avisos_encontrados = []
    if "{otro}" in texto:
        avisos_encontrados.append(
            "contiene «{otro}»: este banco no usa plantillas, revisa el texto"
        )
    if texto[:1].isupper():
        avisos_encontrados.append(
            "empieza en mayúscula: la app antepone «Yo nunca…», debe empezar en minúscula"
        )
    # Palabras que empiezan por mayúscula a partir de la segunda: puede ser un
    # nombre propio colado por error (el banco nunca señala a nadie por nombre).
    palabras = texto.split()
    for palabra in palabras[1:]:
        limpia = re.sub(r"^[^\wáéíóúñ]+", "", palabra, flags=re.IGNORECASE)
        if limpia[:1].isupper():
            avisos_encontrados.append(
                f"la palabra «{palabra}» empieza en mayúscula: ¿es un nombre propio colado por error?"
            )
    if texto.endswith("."):
        avisos_encontrados.append("termina en punto: el banco no lleva punto final")
    return avisos_encontrados


def pedir_texto(frases):
    while True:
        texto = input("Texto (sin «Yo nunca», sin punto final): ").strip()
        if not texto:
            print("El texto no puede estar vacío.")
            continue
        if any(f["texto"] == texto for f in frases):
            print("Ya existe una frase idéntica en el banco. No se añade.")
            continue
        for aviso in avisos(texto):
            print(f"  ⚠️  Aviso: {aviso}")
        if avisos(texto):
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
    frases = cargar()
    print(f"Banco actual: {len(frases)} frases.")
    try:
        while True:
            texto = pedir_texto(frases)
            nivel = pedir_nivel()
            frases.append({"texto": texto, "nivel": nivel})
            guardar(frases)
            regenerar_js(frases)
            print(f"Añadida. Banco ahora: {len(frases)} frases.")
            otra = input("¿Añadir otra? (S/n): ").strip().lower()
            if otra == "n":
                break
    except (KeyboardInterrupt, EOFError):
        print("\nInterrumpido. Lo añadido hasta ahora ya está guardado.")
    print("frases.js regenerado.")


if __name__ == "__main__":
    sys.exit(main())
