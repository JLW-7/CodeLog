# Code Log

A modern time tracking application built with Next.js that helps professionals monitor and analyze their work hours across projects.

## Features

- Time tracking with start/stop functionality
- Project-based organization of time entries
- Visual analytics with contribution-style heatmap
- Session notes and attachments support
- Dark mode support
- Responsive design

## Development

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/zebra-frontend.git
   cd zebra-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Architecture

### Technology Stack

- Next.js - React framework
- Tailwind CSS - Styling
- Zustand - State management
- date-fns - Date manipulation
- Lucide React - Icons

### Project Structure

```
/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   └── lib/          # Utilities and store
├── public/           # Static assets
└── ...config files
```

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the GNU Affero General Public License - see the [LICENSE](LICENSE) file for details.
