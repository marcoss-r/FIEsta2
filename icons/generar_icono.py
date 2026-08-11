"""Genera los iconos de la app FIEsta 2 (icon-512/192/180.png) con Pillow.

Dibuja el mismo motivo que el logo SVG de la pantalla principal (icons/icono.svg
e index.html): planeta (espacio) + órbita con electrón (física) + un "2"
integrado sobre el planeta (FIEsta 2) + estrellas de 4 puntas (fiesta).

Se dibuja en un lienzo grande (supersampling) y se reduce con LANCZOS para
que los bordes queden suaves. Uso:  python icons/generar_icono.py
"""

import os
from PIL import Image, ImageDraw

# --- Ajustes generales ---
S = 2048  # lado del lienzo maestro (se reduce al final)
SALIDA = os.path.dirname(os.path.abspath(__file__))

# --- Paleta (mismos tonos que css/estilos.css, tema rojo) ---
FONDO_TOP = (58, 18, 25)     # --color-superficie #3a1219
FONDO_BOT = (23, 7, 9)       # --color-fondo #170709
PLANETA   = (255, 77, 90)    # --color-acento #ff4d5a
BRILLO    = (255, 143, 152)  # #ff8f98
ORBITA    = (255, 145, 66)   # --color-acento-2 #ff9142
ELECTRON  = (249, 232, 234)  # --color-texto #f9e8ea
ORO       = (255, 206, 84)   # #ffce54
BLANCO    = (255, 255, 255)


def lerp(a, b, t):
    """Interpola dos colores RGB (t entre 0 y 1)."""
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def estrella(draw, cx, cy, r, color):
    """Estrella de 4 puntas: 4 puntas largas + 4 vértices interiores cortos."""
    k = 0.32  # cuánto se "hunden" los lados (radio interior relativo)
    pts = [
        (cx, cy - r), (cx + k * r, cy - k * r),
        (cx + r, cy), (cx + k * r, cy + k * r),
        (cx, cy + r), (cx - k * r, cy + k * r),
        (cx - r, cy), (cx - k * r, cy - k * r),
    ]
    draw.polygon(pts, fill=color + (255,))


def bezier_cuadratica(p0, p1, p2, pasos=24):
    """Muestrea una curva de Bézier cuadrática en `pasos` segmentos."""
    puntos = []
    for i in range(pasos + 1):
        t = i / pasos
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        puntos.append((x, y))
    return puntos


def trazo_dos(draw, pcx, pcy, escala, color, ancho):
    """Dibuja el "2" integrado en el planeta: mismos puntos que el `path` del
    SVG (en el viewBox 0-100, con el planeta centrado en (50,54) y radio 20),
    reescalados a coordenadas de píxel con `escala` = radio_px / 20."""

    def v(vx, vy):
        return (pcx + (vx - 50) * escala, pcy + (vy - 54) * escala)

    # M43 47  Q43 41 50 41  Q57 41 57 47  Q57 52 50 59  L43 66  L58 66
    puntos = []
    puntos += bezier_cuadratica(v(43, 47), v(43, 41), v(50, 41))
    puntos += bezier_cuadratica(v(50, 41), v(57, 41), v(57, 47))
    puntos += bezier_cuadratica(v(57, 47), v(57, 52), v(50, 59))
    puntos += [v(43, 66)]
    puntos += [v(58, 66)]

    draw.line(puntos, fill=color + (255,), width=ancho, joint="curve")
    # Tapas redondeadas en los extremos y en cada unión (line() no las añade).
    r = ancho / 2
    for x, y in puntos:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=color + (255,))


def construir():
    # Fondo con degradado vertical (línea a línea).
    base = Image.new("RGBA", (S, S), FONDO_TOP + (255,))
    d = ImageDraw.Draw(base)
    for y in range(S):
        d.line([(0, y), (S, y)], fill=lerp(FONDO_TOP, FONDO_BOT, y / (S - 1)) + (255,))

    pcx, pcy = int(S * 0.5), int(S * 0.56)  # centro del planeta
    pr = int(S * 0.20)                       # radio del planeta

    # Resplandor suave detrás del planeta (muchos círculos casi transparentes).
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(60, 0, -1):
        rr = pr * (1 + i * 0.03)
        gd.ellipse([pcx - rr, pcy - rr, pcx + rr, pcy + rr],
                   fill=PLANETA + (3,))
    base.alpha_composite(glow)

    # Planeta + brillo.
    d = ImageDraw.Draw(base)
    d.ellipse([pcx - pr, pcy - pr, pcx + pr, pcy + pr], fill=PLANETA + (255,))
    bx, by, br = pcx - int(pr * 0.35), pcy - int(pr * 0.35), int(pr * 0.35)
    hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([bx - br, by - br, bx + br, by + br],
                               fill=BRILLO + (140,))
    base.alpha_composite(hl)

    # Órbita + electrón, dibujados en una capa aparte y rotados.
    orb = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    rx, ry = int(S * 0.36), int(S * 0.13)
    od.ellipse([pcx - rx, pcy - ry, pcx + rx, pcy + ry],
               outline=ORBITA + (255,), width=max(2, int(S * 0.02)))
    er = int(S * 0.032)
    od.ellipse([pcx + rx - er, pcy - er, pcx + rx + er, pcy + er],
               fill=ELECTRON + (255,))
    orb = orb.rotate(20, resample=Image.BICUBIC, center=(pcx, pcy))
    base.alpha_composite(orb)

    # El "2" de FIEsta 2, sobre el planeta (encima de la órbita, como en el SVG).
    d = ImageDraw.Draw(base)
    escala = pr / 20  # el `path` del SVG está en unidades del viewBox (radio 20)
    trazo_dos(d, pcx, pcy, escala, ELECTRON, ancho=max(4, int(S * 0.024)))

    # Confeti estelar: (x, y, radio, color) en fracciones del lienzo.
    estrellas = [
        (0.18, 0.18, 0.075, ORO),
        (0.80, 0.19, 0.050, BLANCO),
        (0.83, 0.70, 0.045, ORBITA),
        (0.16, 0.74, 0.040, BLANCO),
        (0.11, 0.45, 0.030, ORO),
        (0.71, 0.86, 0.030, BLANCO),
    ]
    star = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(star)
    for fx, fy, fr, col in estrellas:
        estrella(sd, S * fx, S * fy, S * fr, col)
    base.alpha_composite(star)

    return base.convert("RGB")


def main():
    maestro = construir()
    for tam, nombre in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png")]:
        ruta = os.path.join(SALIDA, nombre)
        maestro.resize((tam, tam), Image.LANCZOS).save(ruta)
        print("Generado:", ruta)


if __name__ == "__main__":
    main()
