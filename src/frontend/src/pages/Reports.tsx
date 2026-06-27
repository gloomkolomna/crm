import { useState, useEffect } from 'react';

import { Box, Text, Card, CardBody, CardHeader, Grid, Table, Thead, Tbody, Tr, Th, Td, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Select as ChakraSelect, Flex, Badge } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getMaterialStocks, getEquipment, getEquipmentConsumption } from '../api';

interface MaterialStock { id: number; name: string; current_stock: number; min_stock: number | null; unit: string | null; }
interface EquipmentItem { id: number; name: string; specifications: EquipmentSpec[]; }
interface EquipmentSpec { id: number; material_id: number; material_name: string; resource_type: string; total_resource: number; current_resource: number; }

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

function Reports() {
  const [stocks, setStocks] = useState<MaterialStock[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [consumptionData, setConsumptionData] = useState<any[]>([]);
  const [consumptionLoading, setConsumptionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); fetchEquipment(); }, []);
  
  useEffect(() => {
    if (selectedEquipmentId) {
      fetchConsumption(selectedEquipmentId);
    }
  }, [selectedEquipmentId]);
  
  const fetchData = async () => { try { setStocks((await getMaterialStocks()).data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  
  const fetchEquipment = async () => {
    try {
      const res = await getEquipment();
      setEquipment(res.data);
      if (res.data.length > 0) {
        setSelectedEquipmentId(String(res.data[0].id));
      }
    } catch (e) { console.error(e); }
  };
  
  const fetchConsumption = async (equipmentId: string) => {
    setConsumptionLoading(true);
    try {
      const res = await getEquipmentConsumption(Number(equipmentId), 30);
      // Преобразуем данные для графика
      const chartData = res.data.data.map((entry: any) => {
        const chartEntry: any = { date: entry.date };
        Object.keys(entry).forEach(key => {
          if (key !== 'date') {
            chartEntry[key] = entry[key];
          }
        });
        return chartEntry;
      });
      setConsumptionData(chartData);
    } catch (e) { console.error(e); }
    finally { setConsumptionLoading(false); }
  };
  
  const lowStock = stocks.filter(m => m.min_stock !== null && m.current_stock < m.min_stock);

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Отчёты и аналитика</Text>

      {/* Графики расхода оборудования */}
      <Card mb={6}><CardHeader><Text fontWeight="semibold">Расход расходников оборудования</Text></CardHeader><CardBody>
        <Flex gap={4} mb={4} align="center">
          <ChakraSelect 
            value={selectedEquipmentId} 
            onChange={(e) => setSelectedEquipmentId(e.target.value)} 
            w={{ base: '100%', md: '300px' }}
          >
            {equipment.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </ChakraSelect>
          <Badge colorScheme="blue" fontSize="sm">За последние 30 дней</Badge>
        </Flex>
        {consumptionLoading ? (
          <Spinner size="md" />
        ) : consumptionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={consumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(consumptionData[0] || {}).filter(key => key !== 'date').map((material, index) => (
                <Line 
                  key={material} 
                  type="monotone" 
                  dataKey={material} 
                  stroke={COLORS[index % COLORS.length]} 
                  name={material}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text color="gray.500">Нет данных о расходе за выбранный период</Text>
        )}
      </CardBody></Card>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={6}>
        <Card><CardHeader><Text fontWeight="semibold">Остатки материалов</Text></CardHeader><CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stocks}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="current_stock" fill="#8884d8" name="Текущий остаток" /><Bar dataKey="min_stock" fill="#82ca9d" name="Мин. остаток" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody></Card>
        <Card><CardHeader><Text fontWeight="semibold">Распределение остатков</Text></CardHeader><CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart><Pie data={stocks} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="current_stock">
              {stocks.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </CardBody></Card>
      </Grid>

      {lowStock.length > 0 && (
        <Alert status="warning" mb={6} borderRadius="md" flexDirection="column" alignItems="flex-start">
          <AlertIcon />
          <AlertTitle>Материалы с низким остатком!</AlertTitle>
          <AlertDescription mt={2}>
            <Table variant="simple" size="sm">
              <Thead><Tr><Th>Название</Th><Th>Остаток</Th><Th>Минимум</Th></Tr></Thead>
              <Tbody>{lowStock.map(m => <Tr key={m.id}><Td>{m.name}</Td><Td>{m.current_stock}</Td><Td>{m.min_stock}</Td></Tr>)}</Tbody>
            </Table>
          </AlertDescription>
        </Alert>
      )}

      <Card><CardHeader><Text fontWeight="semibold">Все остатки</Text></CardHeader><CardBody>
        <Table variant="simple">
          <Thead><Tr><Th>Название</Th><Th>Остаток</Th><Th>Минимум</Th><Th>Ед. изм.</Th><Th>Статус</Th></Tr></Thead>
          <Tbody>{stocks.map(m => (
            <Tr key={m.id}><Td>{m.name}</Td><Td>{m.current_stock}</Td><Td>{m.min_stock || '-'}</Td><Td>{m.unit || '-'}</Td>
              <Td>{m.min_stock !== null && m.current_stock < m.min_stock ? '🔴 Низкий' : '🟢 В норме'}</Td>
            </Tr>
          ))}</Tbody>
        </Table>
      </CardBody></Card>
    </Box>
  );
}

export default Reports;


