{
  stdenv,
  fetchurl,
  buildNpmPackage,
  libsecret,
  pkg-config,
  makeWrapper,
  electron-bin,
  electron,
  swaybg,
  mpvpaper,
  linux-wallpaperengine,
  cage,
  grim,
  ffmpeg,
  vips,
  lib,
}:

let
  electronCache =
    { electronBin }:
    stdenv.mkDerivation {
      pname = "electron-cache";
      inherit (electronBin) version src;
      dontUnpack = true;
      installPhase =
        let
          zipName = baseNameOf electronBin.src.url;
        in
        ''
          mkdir -p $out
          cp -r $src $out/${zipName}
        '';
    };
in
buildNpmPackage rec {
  pname = "walltone";
  version = "unstable-2025-08-08";

  src = ../../.;

  npmDepsHash = "sha256-dHVg+Phv+jFj3b3ivLQi/TJ5h+TjkUkBlNKh8YJWgfc=";

  dontNpmBuild = true;
  makeCacheWritable = true;

  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
    ELECTRON_FORGE_ELECTRON_ZIP_DIR = electronCache {
      electronBin = electron-bin.overrideAttrs (oldAttrs: {
        src = fetchurl {
          url = "https://github.com/electron/electron/releases/download/v37.2.5/electron-v37.2.5-linux-x64.zip";
          sha256 = "sha256-j7ueBRML3mDbl6BcB5aQOag+etuYhSUfkHJ60eBoS+c=";
        };
        version = "37.2.5";
      });
    };
  };

  buildInputs = [
    libsecret
    vips
  ];

  nativeBuildInputs = [
    pkg-config
    makeWrapper
  ];

  postBuild = ''
    npm run package
  '';

  postInstall = ''
    makeWrapper ${lib.getExe electron} $out/bin/${pname} \
      --add-flags $out/lib/node_modules/${pname}/.vite/build/main.js \
      --prefix PATH : ${
        lib.makeBinPath [
          swaybg
          mpvpaper
          linux-wallpaperengine
          cage
          grim
          ffmpeg
        ]
      }

    install -Dm644 walltone.desktop $out/share/applications/walltone.desktop
    install -Dm644 assets/icon.png $out/share/pixmaps/walltone.png
  '';
}
