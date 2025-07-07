# Walltone

A modern wallpaper manager for Linux that supports static images, videos, and dynamic Wallpaper Engine content. Built with Electron, React, and TypeScript for a beautiful desktop experience.

![Walltone Screenshot](./assets//screenshot.png)

## ✨ Features

### 🖼️ Multi-Format Support
- **Static Images**: JPG, PNG, WebP, and more with swaybg backend
- **Video Wallpapers**: MP4, MKV, WebM with mpvpaper backend
- **Wallpaper Engine**: Full support for Steam Workshop dynamic wallpapers

### 🖥️ Multi-Monitor Management
- Individual wallpaper configuration per display
- Visual monitor layout with click-to-select interface
- Backend-specific scaling options (fill, fit, stretch, center, tile, crop)

### 🎛️ Dynamic Controls
- **Video Controls**: Mute audio, scaling options
- **Wallpaper Engine**: Volume control, FPS limiting, audio processing toggles, mouse/parallax disabling, fullscreen pause control, texture clamping modes
- **Image Controls**: Scaling method selection per backend

### 🌐 Download Sources
- **Pexels**: High-quality stock photography
- **Unsplash**: Professional photography community
- **Wallhaven**: Curated wallpaper collection
- **Wallpaper Engine**: Steam Workshop dynamic wallpapers
- **Local Library**: Scan and manage local folders

### 🔍 Advanced Organization
- Tag-based filtering system for Wallpaper Engine content
- Search across all wallpaper sources
- Sort by name, date, popularity, or custom criteria
- Boolean filters for advanced searching

### 🎨 Theme Generation
- **Base16 Themes**: Generate dark and light Base16 color schemes from wallpapers
- **Material Themes**: Extract Material Design color palettes
- **Color Editing**: Fine-tune generated colors with built-in color picker
- **Theme Export**: Save themes to files for use in other applications

## 🚀 Quick Start

### Prerequisites

**System Requirements:**
- Linux distribution (Wayland)
- Node.js 18+ and npm/yarn
- One or more wallpaper backends:
  - [`swaybg`](https://github.com/swaywm/swaybg) - for static images
  - [`mpvpaper`](https://github.com/GhostNaN/mpvpaper) - for video wallpapers
  - [`linux-wallpaperengine`](https://github.com/catsout/wallpaper-engine-kde-plugin) - for Wallpaper Engine

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/walltone.git
cd walltone

# Install dependencies
npm install

# Start the development server
npm run start
```

### First Setup

1. **Add Wallpaper Folders**: Go to Settings → Library and add folders containing your wallpapers
2. **Configure API Keys**: Add API keys for online sources (Pexels, Unsplash, Wallhaven)
3. **Set Wallpaper Engine Assets Path** (optional): Add your Wallpaper Engine assets path and API key

## 📖 Usage Guide

### Applying Wallpapers

1. **Browse** your library or online sources using the navigation tabs
2. **Search and Filter** using the search bar and filter options
3. **Click** on any wallpaper to open the preview dialog
4. **Configure** monitors and scaling in the Apply dialog
5. **Adjust** dynamic controls (volume, FPS, etc.) if available for the wallpaper type
6. **Apply** to selected displays

### Theme Generation

1. **Open** any wallpaper in the preview dialog
2. **Switch** to theme generation tabs (Base16 or Material)
3. **Edit colors** by clicking on individual color swatches
4. **Save themes** to files for use in other applications

### Managing Your Library

```bash
# Recommended folder structure
~/Wallpapers/
├── Images/           # Static wallpapers
├── Videos/           # Video wallpapers
└── WallpaperEngine/  # Steam Workshop content
```

### Wallpaper Engine Setup

1. Install Wallpaper Engine on Steam
2. Get a [Steam Web API Key](https://steamcommunity.com/dev/apikey)
3. Add the key in Settings → Wallpaper Engine
4. Set your Steam workshop folder path

## ⚙️ Configuration

### Settings Overview

| Category | Options |
|----------|---------|
| **Library** | Local folder paths, scan settings |
| **Wallpaper Engine** | API key, assets folder, workshop path |
| **Online Sources** | API keys for Pexels, Unsplash, Wallhaven |
| **Display** | Default scaling, monitor preferences |
| **Interface** | Theme, startup behavior |

### Advanced Configuration

**Supported Image Formats:**
- JPEG/JPG, PNG, WebP, BMP, TIFF, GIF (static)

**Supported Video Formats:**
- MP4, MKV, WebM, AVI, MOV

## 🏗️ Development

### Project Structure

```
src/
├── electron/          # Main process & backend
│   ├── main.ts        # Electron entry point
│   └── trpc/          # API routes and business logic
├── renderer/          # React frontend
│   ├── components/    # Reusable UI components
│   ├── tabs/          # Main application views
│   └── hooks/         # Custom React hooks
└── shared/            # Shared types and utilities
```

### Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Electron, tRPC, Zod validation
- **State Management**: TanStack Query
- **Build Tools**: Vite, Electron Forge

### Development Commands

```bash
# Start development server
npm run start

# Build for production
npm run make

# Run tests
npm run test
npm run test:e2e

# Lint and format
npm run format
```

## 🔧 Troubleshooting

### Common Issues

**Wallpapers not applying:**
```bash
# Check if required backends are installed
which swaybg mpvpaper linux-wallpaperengine

# Check permissions
ls -la ~/.config/walltone/
```

**Video wallpapers not working:**
```bash
# Install mpvpaper
sudo pacman -S mpvpaper  # Arch
sudo apt install mpvpaper  # Ubuntu/Debian
```

**Wallpaper Engine issues:**
- Verify Steam API key is valid
- Check workshop folder permissions
- Ensure `linux-wallpaperengine` is in PATH

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation for API changes
- Use conventional commits
- Test on different Linux distributions

## 🛠️ Built With

- **[Electron](https://electronjs.org)** - Desktop application framework
- **[React](https://reactjs.org)** - User interface library
- **[TailwindCSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com)** - Beautiful component library
- **[TypeScript](https://typescriptlang.org)** - Type safety
- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [swaybg](https://github.com/swaywm/swaybg) - Wayland wallpaper tool
- [mpvpaper](https://github.com/GhostNaN/mpvpaper) - Video wallpaper support
- [linux-wallpaperengine](https://github.com/catsout/wallpaper-engine-kde-plugin) - Wallpaper Engine compatibility

## 📬 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-username/walltone/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/walltone/discussions)

---

<p align="center">
  Made with ❤️ for the Linux desktop community
</p>
