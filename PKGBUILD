pkgname=walltone
pkgver=0.0.1
pkgrel=1
pkgdesc="Wallpaper and theme management application"
arch=("x86_64")
url="https://github.com/kasper24/walltone"
license=("GPL3")
depends=("nss" "libsecret" "swaybg" "mpvpaper" "cage" "grim" "wayland-utils")
makedepends=("npm" "nodejs" "git")
source=("$pkgname::git+$url.git")
sha256sums=("SKIP")

build() {
    cd "$srcdir/$pkgname"
    npm ci
    npm run package
}

package() {
    install -d -m755 "${pkgdir}/opt/${pkgname}"
    install -d -m755 "${pkgdir}/usr/bin"
    install -d -m755 "${pkgdir}/usr/share/"{applications,pixmaps}

    outdir=$(find "${srcdir}/${pkgname}/out" -maxdepth 1 -type d -name "walltone-linux-*")
    cp -r "$outdir/." "${pkgdir}/opt/${pkgname}/"
    ln -s "/opt/${pkgname}/Walltone" "${pkgdir}/usr/bin/walltone"
    ln -s "/opt/${pkgname}/LICENSE" "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"
    install -Dm644 "$srcdir/walltone.desktop" "${pkgdir}/usr/share/applications/walltone.desktop"
    install -Dm644 "$srcdir/assets/icon.png" "${pkgdir}/usr/share/pixmaps/walltone.png"
}
