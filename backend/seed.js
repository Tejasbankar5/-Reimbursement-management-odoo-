const axios = require('axios');

async function seedData() {
  try {
    console.log('Starting data seed...');
    
    // 1. Create Admin & Company
    const adminData = {
      email: 'admin@acme.com',
      password: 'password123',
      name: 'Admin Boss',
      companyName: 'Acme Corp',
      country: 'United States'
    };
    
    console.log('Creating Admin Account...');
    const adminRes = await axios.post('http://localhost:5000/api/auth/signup', adminData);
    const adminToken = adminRes.data.token;
    console.log('✅ Admin account created. Token received.');

    // 2. Create Manager
    const managerData = {
      email: 'manager@acme.com',
      password: 'password123',
      name: 'Manager Mike',
      role: 'MANAGER'
    };
    
    const config = { headers: { Authorization: `Bearer ${adminToken}` } };
    
    console.log('Creating Manager Account...');
    const managerRes = await axios.post('http://localhost:5000/api/admin/users', managerData, config);
    const managerId = managerRes.data.user.id;
    console.log('✅ Manager account created.');

    // 3. Create Employee reporting to the Manager
    const employeeData = {
      email: 'employee@acme.com',
      password: 'password123',
      name: 'Employee Emma',
      role: 'EMPLOYEE',
      managerId: managerId
    };
    
    console.log('Creating Employee Account...');
    await axios.post('http://localhost:5000/api/admin/users', employeeData, config);
    console.log('✅ Employee account created.');

    console.log('\n================ SEEDING SUCCESSFUL ================');
    console.log('You can log in with the following accounts (Password for all: password123)');
    console.log('1. Admin:    admin@acme.com');
    console.log('2. Manager:  manager@acme.com');
    console.log('3. Employee: employee@acme.com');
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Error seeding data:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

seedData();
