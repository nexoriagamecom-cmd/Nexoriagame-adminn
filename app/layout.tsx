export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%237c3aed'/%3E%3Ctext x='50' y='72' font-size='64' text-anchor='middle' fill='white' font-weight='bold' font-family='Arial'%3EN%3C/text%3E%3Ctext x='30' y='35' font-size='28' fill='white'%3E🎮%3C/text%3E%3C/svg%3E" />
        <link rel="shortcut icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%237c3aed'/%3E%3Ctext x='50' y='72' font-size='64' text-anchor='middle' fill='white' font-weight='bold' font-family='Arial'%3EN%3C/text%3E%3Ctext x='30' y='35' font-size='28' fill='white'%3E🎮%3C/text%3E%3C/svg%3E" />
      </head>
      <body style={{ margin: 0, background: '#0a0a0a', color: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
