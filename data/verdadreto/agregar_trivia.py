#!/usr/bin/env python3
"""Da de alta preguntas del test rápido (modo arcade de vr) desde consola.

Uso: python3 data/verdadreto/agregar_trivia.py

Lee y escribe trivia.json (fuente) y regenera trivia.js a partir de él. No
editar trivia.js a mano: se pierde en la siguiente ejecución de este script.

Va aparte de agregar.py porque el banco tiene otra forma: las verdades y los
retos son {texto, nivel}, y aquí cada entrada es
{categoria, pregunta, correcta, incorrectas}. La correcta se guarda por TEXTO y
no por índice, y el juego baraja las cuatro opciones al pintarlas: así es
imposible desincronizar el .json y no se puede memorizar "siempre es la B".
"""
import sys
from pathlib import Path

from agregar import cargar, guardar  # mismas utilidades que el banco principal

CARPETA = Path(__file__).resolve().parent
RUTA_JSON = CARPETA / "trivia.json"
RUTA_JS = CARPETA / "trivia.js"
CATEGORIAS = ("geografia", "mates", "historia", "banderas")
OPCIONES_FALSAS = 3


def escapar(texto):
    return texto.replace("\\", "\\\\").replace('"', '\\"')


def regenerar_js(datos):
    lineas = [
        '// Banco de preguntas del test rápido del modo arcade de "Verdad o Reto" (vr).',
        "// Generado desde trivia.json — no editar a mano (usar agregar_trivia.py).",
        "const VR_TRIVIA = [",
    ]
    for categoria in CATEGORIAS:
        de_categoria = [d for d in datos if d["categoria"] == categoria]
        if not de_categoria:
            continue
        lineas.append(f"  // ── {categoria}")
        for entrada in de_categoria:
            falsas = ", ".join(f'"{escapar(t)}"' for t in entrada["incorrectas"])
            lineas.append(
                f'  {{ categoria: "{categoria}", pregunta: "{escapar(entrada["pregunta"])}", '
                f'correcta: "{escapar(entrada["correcta"])}", incorrectas: [{falsas}] }},'
            )
        lineas.append("")
    while lineas and lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    RUTA_JS.write_text("\n".join(lineas) + "\n", encoding="utf-8")


def pedir_categoria():
    while True:
        categoria = input(f"Categoría ({'/'.join(CATEGORIAS)}): ").strip().lower()
        if categoria in CATEGORIAS:
            return categoria
        print(f"Categoría no válida. Debe ser una de: {', '.join(CATEGORIAS)}.")


def pedir_pregunta(datos):
    while True:
        pregunta = input("Pregunta: ").strip()
        if not pregunta:
            print("La pregunta no puede estar vacía.")
            continue
        if any(d["pregunta"] == pregunta for d in datos):
            print("Ya existe una pregunta idéntica en el banco. No se añade.")
            continue
        if "?" not in pregunta:
            print("  ⚠️  Aviso: no lleva «?»: revisa que sea una pregunta completa.")
        return pregunta


def pedir_opciones():
    while True:
        correcta = input("Respuesta correcta: ").strip()
        if not correcta:
            print("La respuesta correcta no puede estar vacía.")
            continue
        incorrectas = []
        for i in range(OPCIONES_FALSAS):
            falsa = input(f"Opción falsa {i + 1} de {OPCIONES_FALSAS}: ").strip()
            if not falsa:
                print("Las tres opciones falsas son obligatorias. Empezamos de nuevo.")
                break
            incorrectas.append(falsa)
        else:
            todas = [correcta] + incorrectas
            if len(set(todas)) != len(todas):
                print("Hay opciones repetidas. Empezamos de nuevo.")
                continue
            return correcta, incorrectas


def main():
    datos = cargar(RUTA_JSON)
    print(f"Preguntas en el banco: {len(datos)}")
    try:
        while True:
            categoria = pedir_categoria()
            pregunta = pedir_pregunta(datos)
            correcta, incorrectas = pedir_opciones()
            datos.append(
                {
                    "categoria": categoria,
                    "pregunta": pregunta,
                    "correcta": correcta,
                    "incorrectas": incorrectas,
                }
            )
            guardar(RUTA_JSON, datos)
            regenerar_js(datos)
            print(f"Añadida. Preguntas ahora: {len(datos)}.")
            if input("¿Añadir otra? (S/n): ").strip().lower() == "n":
                break
    except (KeyboardInterrupt, EOFError):
        print("\nInterrumpido. Lo añadido hasta ahora ya está guardado.")
    print("trivia.js regenerado.")


if __name__ == "__main__":
    sys.exit(main())
