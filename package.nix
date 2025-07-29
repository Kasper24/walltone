{ pkgs }:

let
  electronCache =
    { electron-bin }:
    pkgs.stdenv.mkDerivation {
      pname = "electron-cache";
      inherit (electron-bin) src version;
      dontUnpack = true;
      installPhase =
        let
          # shasum not needed since we can overload the electron zip dir in forge config
          shasum = builtins.hashString "sha256" (dirOf electron-bin.src.url);
          zipName = baseNameOf electron-bin.src.url;
        in
        ''
          # mkdir -p $out/${shasum}
          # cp $src $out/${shasum}/${zipName}
          mkdir -p $out
          cp -r $src $out/${zipName}
        '';
    };
in
pkgs.buildNpmPackage rec {
  pname = "walltone";
  version = "0.1";

  src = ./.;

  npmDepsHash = "sha256-3mNyZYt6ROW+VM4d1od0XYOXrdq9R3lFD/+bNvAzBK0=";

  dontNpmBuild = true;
  makeCacheWritable = true;

  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
    ELECTRON_FORGE_ELECTRON_ZIP_DIR = electronCache {
      electron-bin = pkgs.electron_36-bin;
    };
  };

  postBuild = ''
    npm run package
  '';

  postInstall = ''
    makeWrapper ${pkgs.electron}/bin/electron $out/bin/${pname} \
      --add-flags $out/lib/node_modules/${pname}/.vite/build/main.js \
      --prefix PATH : ${
        pkgs.lib.makeBinPath [
          pkgs.swaybg
          pkgs.ffmpeg
          pkgs.mpvpaper
          pkgs.linux-wallpaperengine
          pkgs.cage
          pkgs.grim
        ]
      }

    install -Dm644 walltone.desktop $out/share/applications/walltone.desktop
    install -Dm644 assets/icon-monochrome.png $out/share/pixmaps/walltone.png
  '';
}
