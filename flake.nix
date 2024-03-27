{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.05";
    ww-node-overlays.url = "github:wunderwerkio/nix-node-packages-overlays";
    ww-utils.url = "github:wunderwerkio/nix-ww-utils";
  };

  outputs = {
    self,
    nixpkgs,
    ww-node-overlays,
    ww-utils,
  }: {
    devShells = ww-utils.lib.forEachWunderwerkSystem (
      system: let
        overlays = with ww-node-overlays.overlays; [
          pnpm
        ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
      in rec {
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs-18_x

            nodePackages.pnpm-latest
          ];

          shellHook = ''
            if [ ! -d "node_modules" ]; then
              echo ""
              echo "It seems this is the first time running the project."
              echo "You can start the install process by running the following command:"
              echo ""
              echo "nix develop '.#setup'"
              echo ""
            fi
          '';
        };
        setup = pkgs.mkShell {
          buildInputs = default.buildInputs;

          shellHook = ''
            if [ ! -d "node_modules" ]; then
              pnpm install

              echo ""
              echo "Run next: pnpm dev"
              echo "Run storybook: pnpm storybook"
              echo ""

              exit 0
            fi
          '';
        };
      }
    );

    formatter = ww-utils.lib.forEachWunderwerkSystem (
      system:
        nixpkgs.legacyPackages.${system}.alejandra
    );
  };
}
