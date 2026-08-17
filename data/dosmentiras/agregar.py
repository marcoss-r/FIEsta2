#!/usr/bin/env python3
"""Da de alta temas nuevos en el banco de "Dos mentiras y una verdad" (dm)
desde consola.

Uso: python3 data/dosmentiras/agregar.py

Lee y escribe temas.json (fuente) y regenera temas.js a partir de él. No
editar temas.js a mano: se pierde en la siguiente ejecución de este script.
"""
import json
import sys
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
RUTA_JSON = CARPETA / "temas.json"
RUTA_JS = CARPETA / "temas.js"
NIVELES = ("suave", "picante", "extremo")
TIPOS = ("tema", "arranque")


def cargar():
    with open(RUTA_JSON, encoding="utf-8") as f:
        return json.load(f)


def guardar(temas):
    with open(RUTA_JSON, "w", encoding="utf-8") as f:
        json.dump(temas, f, ensure_ascii=False, indent=2)
        f.write("\n")


def regenerar_js(temas):
    lineas = [
        '// Banco de temas de "Dos mentiras y una verdad" (dm).',
        "// Generado desde temas.json — no editar a mano (usar agregar.py).",
        "const DM_TEMAS = [",
    ]
    for tipo in TIPOS:
        del_tipo = [t for t in temas if t["tipo"] == tipo]
        if not del_tipo:
            continue
        etiqueta = "tema (ámbito abierto)" if tipo == "tema" else "arranque (frase empezada)"
        lineas.append(f"  // ── {etiqueta}")
        for nivel in NIVELES:
            del_nivel = [t for t in del_tipo if t["nivel"] == nivel]
            if not del_nivel:
                continue
            lineas.append(f"  // {nivel}")
            for t in del_nivel:
                texto = t["texto"].replace('"', '\\"')
                lineas.append(f'  {{ texto: "{texto}", tipo: "{tipo}", nivel: "{nivel}" }},')
        lineas.append("")
    while lineas and lineas[-1] == "":
        lineas.pop()
    lineas.append("];")
    RUTA_JS.write_text("\n".join(lineas) + "\n", encoding="utf-8")


def avisos(texto, tipo):
    """Devuelve una lista de avisos (no bloquean el alta, solo informan). Solo
    para "tema": si acaba en punto o pasa de ~40 caracteres, suele ser señal
    de que en realidad es un "arranque" (§6 Fase 3 del plan del juego)."""
    avisos_encontrados = []
    if tipo == "tema":
        if texto.endswith("."):
            avisos_encontrados.append("termina en «.»: un «tema» no lleva punto final")
        if len(texto) > 40:
            avisos_encontrados.append(
                f"tiene {len(texto)} caracteres: un «tema» debe ser un ámbito corto "
                "(¿es en realidad un «arranque»?)"
            )
    return avisos_encontrados


def pedir_tipo():
    while True:
        tipo = input(f"Tipo ({'/'.join(TIPOS)}): ").strip().lower()
        if tipo in TIPOS:
            return tipo
        print(f"Tipo no válido. Debe ser uno de: {', '.join(TIPOS)}.")


def pedir_texto(temas, tipo):
    while True:
        texto = input("Texto (sin punto final): ").strip()
        if not texto:
            print("El texto no puede estar vacío.")
            continue
        if any(t["texto"] == texto for t in temas):
            print("Ya existe un tema idéntico en el banco. No se añade.")
            continue
        for aviso in avisos(texto, tipo):
            print(f"  ⚠️  Aviso: {aviso}")
        if avisos(texto, tipo):
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
    temas = cargar()
    print(f"Banco actual: {len(temas)} temas.")
    try:
        while True:
            tipo = pedir_tipo()
            texto = pedir_texto(temas, tipo)
            nivel = pedir_nivel()
            temas.append({"texto": texto, "tipo": tipo, "nivel": nivel})
            guardar(temas)
            regenerar_js(temas)
            print(f"Añadido. Banco ahora: {len(temas)} temas.")
            otro = input("¿Añadir otro? (S/n): ").strip().lower()
            if otro == "n":
                break
    except (KeyboardInterrupt, EOFError):
        print("\nInterrumpido. Lo añadido hasta ahora ya está guardado.")
    print("temas.js regenerado.")


if __name__ == "__main__":
    sys.exit(main())
