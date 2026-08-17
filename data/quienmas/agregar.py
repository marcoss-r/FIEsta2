#!/usr/bin/env python3
"""Da de alta preguntas nuevas en el banco de "Quién es más…" (qm) desde consola.

Uso: python3 data/quienmas/agregar.py

Lee y escribe preguntas.json (fuente) y regenera preguntas.js a partir de él.
No editar preguntas.js a mano: se pierde en la siguiente ejecución de este
script.
"""
import json
import re
import sys
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
RUTA_JSON = CARPETA / "preguntas.json"
RUTA_JS = CARPETA / "preguntas.js"
NIVELES = ("normal", "picante")
TIPOS = ("probable", "adjetivo")


def cargar():
    with open(RUTA_JSON, encoding="utf-8") as f:
        return json.load(f)


def guardar(preguntas):
    with open(RUTA_JSON, "w", encoding="utf-8") as f:
        json.dump(preguntas, f, ensure_ascii=False, indent=2)
        f.write("\n")


def regenerar_js(preguntas):
    lineas = [
        '// Banco de preguntas de "Quién es más…" (qm).',
        "// Generado desde preguntas.json — no editar a mano (usar agregar.py).",
        "const QM_PREGUNTAS = [",
    ]
    for tipo in TIPOS:
        del_tipo = [p for p in preguntas if p["tipo"] == tipo]
        if not del_tipo:
            continue
        lineas.append(f"  // ── {tipo}")
        for p in del_tipo:
            texto = p["texto"].replace('"', '\\"')
            lineas.append(f'  {{ texto: "{texto}", tipo: "{tipo}", nivel: "{p["nivel"]}" }},')
        lineas.append("")
    while lineas and lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    RUTA_JS.write_text("\n".join(lineas) + "\n", encoding="utf-8")


def avisos(texto):
    """Devuelve una lista de avisos (no bloquean el alta, solo informan)."""
    avisos_encontrados = []
    if texto[:1].isupper():
        avisos_encontrados.append(
            "empieza en mayúscula: el encabezado lo pone la app, el texto va en minúscula"
        )
    if texto.endswith("?") or texto.endswith("."):
        avisos_encontrados.append("termina en «?» o «.»: el banco no lleva ni pregunta ni punto final")
    palabras = texto.split()
    for palabra in palabras[1:]:
        limpia = re.sub(r"^[^\wáéíóúñ]+", "", palabra, flags=re.IGNORECASE)
        if limpia[:1].isupper() and "{otro}" not in palabra:
            avisos_encontrados.append(
                f"la palabra «{palabra}» empieza en mayúscula: ¿es un nombre propio colado por error?"
            )
    return avisos_encontrados


def pedir_texto(preguntas):
    while True:
        texto = input("Texto (sin encabezado, sin «?» final): ").strip()
        if not texto:
            print("El texto no puede estar vacío.")
            continue
        if any(p["texto"] == texto for p in preguntas):
            print("Ya existe una pregunta idéntica en el banco. No se añade.")
            continue
        for aviso in avisos(texto):
            print(f"  ⚠️  Aviso: {aviso}")
        if avisos(texto):
            confirmar = input("¿Añadir de todas formas? (s/N): ").strip().lower()
            if confirmar != "s":
                continue
        return texto


def pedir_tipo():
    while True:
        tipo = input(f"Tipo ({'/'.join(TIPOS)}): ").strip().lower()
        if tipo in TIPOS:
            return tipo
        print(f"Tipo no válido. Debe ser uno de: {', '.join(TIPOS)}.")


def pedir_nivel():
    while True:
        nivel = input(f"Nivel ({'/'.join(NIVELES)}): ").strip().lower()
        if nivel in NIVELES:
            return nivel
        print(f"Nivel no válido. Debe ser uno de: {', '.join(NIVELES)}.")


def main():
    preguntas = cargar()
    print(f"Banco actual: {len(preguntas)} preguntas.")
    try:
        while True:
            texto = pedir_texto(preguntas)
            tipo = pedir_tipo()
            nivel = pedir_nivel()
            preguntas.append({"texto": texto, "tipo": tipo, "nivel": nivel})
            guardar(preguntas)
            regenerar_js(preguntas)
            print(f"Añadida. Banco ahora: {len(preguntas)} preguntas.")
            otra = input("¿Añadir otra? (S/n): ").strip().lower()
            if otra == "n":
                break
    except (KeyboardInterrupt, EOFError):
        print("\nInterrumpido. Lo añadido hasta ahora ya está guardado.")
    print("preguntas.js regenerado.")


if __name__ == "__main__":
    sys.exit(main())
