"""Emit an easing gradient using the stop curve lifted from lab01.dev/experiments/12."""

CURVE = [
    (0.0000, 0.00), (0.0071, 11.79), (0.0357, 21.38), (0.0714, 29.12),
    (0.1214, 35.34), (0.1786, 40.37), (0.2500, 44.56), (0.3286, 48.24),
    (0.4071, 51.76), (0.5000, 55.44), (0.5857, 59.63), (0.6714, 64.66),
    (0.7643, 70.88), (0.8429, 78.62), (0.9286, 88.21), (1.0000, 100.00),
]


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb2hex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(v))) for v in c)


def easing_gradient(c1, c2, angle="90deg"):
    a, b = hex2rgb(c1), hex2rgb(c2)
    stops = []
    for t, pos in CURVE:
        col = rgb2hex(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))
        stops.append("%s %.2f%%" % (col, pos))
    return "linear-gradient(%s, %s)" % (angle, ", ".join(stops))


if __name__ == "__main__":
    import sys
    print(easing_gradient(sys.argv[1], sys.argv[2]))
