{
  description = "Walltone";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        walltone = pkgs.callPackage ./package.nix {
          inherit pkgs;
        };
      in
      {
        packages = {
          default = walltone;
          walltone = walltone;
        };
      });
}
