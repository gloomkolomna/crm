import { useState, useEffect } from 'react';

import { Box, Text, Card, CardBody, CardHeader, Grid, Flex, Spinner } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getMaterials, getCustomers, getOrders, getProducts } from '../api';
import { FiPackage, FiBox, FiUsers, FiShoppingCart } from 'react-icons/fi';

function Dashboard() {
  const [materialCount, setMaterialCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    console.log('Dashboard fetchData called');
    try {
      const [materialsRes, customersRes, ordersRes, productsRes] = await Promise.all([
        getMaterials(), getCustomers(), getOrders(), getProducts(),
      ]);
      console.log('Dashboard data loaded:', { materials: materialsRes.data.length, customers: customersRes.data.length, orders: ordersRes.data.length, products: productsRes.data.length });
      setMaterialCount(materialsRes.data.length);
      setCustomerCount(customersRes.data.length);
      setOrderCount(ordersRes.data.length);
      setProductCount(productsRes.data.length);

      setMaterialsData(materialsRes.data.slice(0, 10).map((m: any) => ({
        name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
        Остаток: m.current_stock, Минимум: m.min_stock || 0,
      })));

      const ordersByDate: { [key: string]: number } = {};
      ordersRes.data.forEach((o: any) => { ordersByDate[o.order_date] = (ordersByDate[o.order_date] || 0) + o.total_amount; });
      setOrdersData(Object.entries(ordersByDate).sort(([a], [b]) => a.localeCompare(b)).slice(-10).map(([date, amount]) => ({ date, Сумма: amount })));
    } catch (error) { 
      console.error('Dashboard fetch error:', error); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Flex justify="center" align="center" h="200px"><Spinner size="xl" /></Flex>;

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Дашборд</Text>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} mb={6}>
        <Card><CardBody><Flex direction="column" align="center" gap={2}>
          <FiPackage size={32} color="#3182ce" /><Text fontSize="3xl" fontWeight="bold">{materialCount}</Text><Text color="gray.500">Материалы</Text>
        </Flex></CardBody></Card>
        <Card><CardBody><Flex direction="column" align="center" gap={2}>
          <FiBox size={32} color="#38a169" /><Text fontSize="3xl" fontWeight="bold">{productCount}</Text><Text color="gray.500">Продукты</Text>
        </Flex></CardBody></Card>
        <Card><CardBody><Flex direction="column" align="center" gap={2}>
          <FiUsers size={32} color="#d69e2e" /><Text fontSize="3xl" fontWeight="bold">{customerCount}</Text><Text color="gray.500">Клиенты</Text>
        </Flex></CardBody></Card>
        <Card><CardBody><Flex direction="column" align="center" gap={2}>
          <FiShoppingCart size={32} color="#e53e3e" /><Text fontSize="3xl" fontWeight="bold">{orderCount}</Text><Text color="gray.500">Заказы</Text>
        </Flex></CardBody></Card>
      </Grid>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        <Card><CardHeader><Text fontWeight="semibold">Остатки материалов</Text></CardHeader><CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={materialsData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="Остаток" fill="#8884d8" /><Bar dataKey="Минимум" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody></Card>
        <Card><CardHeader><Text fontWeight="semibold">Продажи по датам</Text></CardHeader><CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="Сумма" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody></Card>
      </Grid>
    </Box>
  );
}

export default Dashboard;

