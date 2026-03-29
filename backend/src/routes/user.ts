import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { User, Company } from '../models';

const router = Router();

// Get My Profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const company = await Company.findByPk(user.companyId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        managerId: user.managerId
      },
      company
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Team — returns all users in the company (excluding current user)
// For MANAGER: only their direct reports
// For ADMIN: all employees and managers in the company
router.get('/team', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role === 'EMPLOYEE') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let whereClause: any = {
      companyId: user.companyId,
    };

    if (user.role === 'MANAGER') {
      // Managers only see their direct reports
      whereClause.managerId = user.id;
    }
    // Admins see everyone in the company (all roles)

    const team = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'managerId'],
      order: [['role', 'ASC'], ['name', 'ASC']]
    });

    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
