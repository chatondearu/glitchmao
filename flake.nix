{
  description = "GlitchMao development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            rustc
            cargo
            rustfmt
            clippy
            nodejs_22
            gnupg
            exiftool
            postgresql_16
            docker
            docker-compose
          ];

          shellHook = ''
            echo "GlitchMao dev shell ready."
            echo "Use: npm install --prefix apps/web-nuxt"
          '';
        };
      });
}
