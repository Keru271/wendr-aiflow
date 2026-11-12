import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FixPilot | Autonomous Bug-Fixing Platform',
    short_name: 'FixPilot',
    description: 'Autonomous Jira Bug Fixing Engine with Google Antigravity & Human Approval Gates',
    start_url: '/',
    id: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#090d16',
    theme_color: '#0d1322',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ],
    shortcuts: [
      {
        name: 'Fix Jobs',
        short_name: 'Jobs',
        description: 'View live autonomous fix jobs',
        url: '/jobs',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Pull Requests',
        short_name: 'PRs',
        description: 'Review generated pull requests',
        url: '/pull-requests',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Deployments',
        short_name: 'Deploys',
        description: 'Inspect approvals and staging',
        url: '/deployments',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      }
    ]
  };
}

