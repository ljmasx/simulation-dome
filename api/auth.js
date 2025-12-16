// Vercel Serverless Function - Authentification DOME Simulator
export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    // Vérification contre les variables d'environnement Vercel
    const accessCodes = {
        [process.env.CODE_FUJIFILM]: 'Fujifilm',
        [process.env.CODE_HCL]: 'HCL Lyon',
        [process.env.CODE_MICROTECH]: 'Microtech',
        [process.env.CODE_HEALTH_EMEA]: 'Health EMEA'
    };

    const org = accessCodes[password];

    if (org) {
        return res.status(200).json({ success: true, organization: org });
    } else {
        return res.status(401).json({ success: false, error: 'Invalid access code' });
    }
}
