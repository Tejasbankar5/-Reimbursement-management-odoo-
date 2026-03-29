import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User, Company } from '../models';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Admin Signup (Initial setup)
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, companyName, country } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Fetch base currency based on country
    let baseCurrency = 'USD';
    try {
      if (country) {
        const response = await axios.get(`https://restcountries.com/v3.1/name/${country}`);
        if (response.data && response.data.length > 0) {
          const currencies = response.data[0].currencies;
          if (currencies) {
            baseCurrency = Object.keys(currencies)[0];
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch country currency, defaulting to USD');
    }

    // Auto-create company
    const newCompany = await Company.create({
      name: companyName,
      country,
      baseCurrency
    }) as any;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin user
    const newUser = await User.create({
      email,
      passwordHash: hashedPassword,
      name,
      role: 'ADMIN',
      companyId: newCompany.id
    }) as any;

    const token = jwt.sign({ id: newUser.id, role: newUser.role, companyId: newCompany.id }, SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: newUser.id, email, name, role: 'ADMIN' }, company: newCompany });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } }) as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, companyId: user.companyId }, SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
