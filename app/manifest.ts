import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MB Tá Ótimo',
        short_name: 'MB Tá Ótimo',
        description: 'Nosso Life OS',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
    }
}
