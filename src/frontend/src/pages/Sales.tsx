import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect, Table, Thead, Tbody, Tr, Th, Td,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, Badge, Checkbox,
  useDisclosure, FormLabel, Tabs, TabList, TabPanels, Tab, TabPanel, Grid
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiTrendingUp, FiList, FiCheck, FiTruck, FiPackage, FiShoppingCart } from 'react-icons/fi';
import {
  getOrders, createOrder, updateOrder, deleteOrder,
  getOrderItems, addOrderItem, deleteOrderItem,
  getSalesSummary, getTopProducts, getTopCustomers,
  getShippingMethods, getProductMaterials, getProductEquipment
} from '../api';
import { getCustomers, getProducts } from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Order {
  id: number; customer_id: number; customer_name: string; order_date: string;
  total_amount: number; delivery_cost: number; delivery_paid_by_customer: boolean;
  is_paid: boolean; is_shipped?: boolean; shipped_at?: string; shipping_method?: string;
}
interface OrderItem { id: number; product_id: number; product_name: string; quantity: number; price_per_unit: number; total_price: number; }
interface Customer { id: number; name: string; }
interface Product { id: number; name: string; sale_price?: number | null; }

function Sales() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ customer_id: '', order_date: new Date().toISOString().split('T')[0], delivery_cost: '0', delivery_paid_by_customer: false, is_paid: false, is_shipped: false, shipped_at: '', shipping_method: '' });

  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [productMaterials, setProductMaterials] = useState<any[]>([]);
  const [productEquipment, setProductEquipment] = useState<any[]>([]);

  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [existingOrderItems, setExistingOrderItems] = useState<OrderItem[]>([]);

  const [summary, setSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const ordersRes = await getOrders();
      setOrders(ordersRes.data.map((o: any) => ({ ...o, customer_name: o.customer_id })));
      const [custRes, prodRes, shipRes] = await Promise.all([
        getCustomers().catch(() => ({ data: [] })),
        getProducts().catch(() => ({ data: [] })),
        getShippingMethods().catch(() => ({ data: [] })),
      ]);
      setCustomers(custRes.data); setProducts(prodRes.data); setShippingMethods(shipRes.data);
      const custMap = new Map(custRes.data.map((c: Customer) => [c.id, c.name]));
      setOrders(prev => prev.map((o: any) => ({ ...o, customer_name: custMap.get(o.customer_id) || 'ID:' + o.customer_id })));
      try {
        const [sr, tp, tc] = await Promise.all([getSalesSummary(), getTopProducts(5), getTopCustomers(5)]);
        setSummary(sr.data); setTopProducts(tp.data); setTopCustomers(tc.data);
      } catch (e) { console.error(e); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpen = async (o?: Order) => {
    setEditing(o || null);
    setForm(o ? { customer_id: String(o.customer_id), order_date: o.order_date, delivery_cost: String(o.delivery_cost), delivery_paid_by_customer: o.delivery_paid_by_customer, is_paid: o.is_paid, is_shipped: o.is_shipped || false, shipped_at: o.shipped_at || '', shipping_method: o.shipping_method || '' } : { customer_id: '', order_date: new Date().toISOString().split('T')[0], delivery_cost: '0', delivery_paid_by_customer: false, is_paid: false, is_shipped: false, shipped_at: '', shipping_method: '' });
    setNewItemProductId(''); setNewItemQty('1'); setNewItemPrice('');
    setProductMaterials([]); setProductEquipment([]);

    if (o) {
      try {
        const res = await getOrderItems(o.id);
        const prodMap = new Map(products.map((p: Product) => [p.id, p.name]));
        setOrderItems(res.data.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: prodMap.get(item.product_id) || 'ID:' + item.product_id,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          total_price: item.total_price,
        })));
      } catch (e) { console.error(e); }
    } else {
      setOrderItems([]);
    }
    onOpen();
  };

  const handleClose = () => { onClose(); setEditing(null); setOrderItems([]); };

  const handleAddItemToForm = async () => {
    if (!newItemProductId || !newItemQty) return;
    const product = products.find(p => p.id === Number(newItemProductId));
    const price = Number(newItemPrice) || product?.sale_price || 0;
    const qty = Number(newItemQty);
    const productId = Number(newItemProductId);

    const existingIndex = orderItems.findIndex(i => i.product_id === productId);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + qty;
      updated[existingIndex] = { ...existing, quantity: newQty, total_price: newQty * existing.price_per_unit };
      setOrderItems(updated);
    } else {
      const item = { id: Date.now(), product_id: productId, product_name: product?.name || 'ID:' + productId, quantity: qty, price_per_unit: price, total_price: qty * price };
      setOrderItems([...orderItems, item]);
    }
    setNewItemProductId(''); setNewItemQty('1'); setNewItemPrice('');
    setProductMaterials([]); setProductEquipment([]);
  };

  const handleRemoveItemFromForm = (tempId: number) => { setOrderItems(orderItems.filter(i => i.id !== tempId)); };

  const handleProductSelect = async (productId: string) => {
    setNewItemProductId(productId);
    if (productId) {
      try {
        const [matRes, eqRes] = await Promise.all([getProductMaterials(Number(productId)), getProductEquipment(Number(productId))]);
        setProductMaterials(matRes.data); setProductEquipment(eqRes.data);
        const product = products.find(p => p.id === Number(productId));
        if (product?.sale_price) setNewItemPrice(String(product.sale_price));
      } catch (e) { console.error(e); }
    } else { setProductMaterials([]); setProductEquipment([]); }
  };

  const handleSubmit = async () => {
    try {
      const data: any = {
        customer_id: Number(form.customer_id), order_date: form.order_date,
        delivery_cost: Number(form.delivery_cost), delivery_paid_by_customer: form.delivery_paid_by_customer,
        is_paid: form.is_paid, is_shipped: form.is_shipped,
        shipped_at: form.shipped_at || null, shipping_method: form.shipping_method || null,
        total_amount: orderItems.reduce((sum, i) => sum + i.total_price, 0),
      };

      if (editing) {
        await updateOrder(editing.id, data);
        for (const item of orderItems) {
          if (item.id > 1000000000000) {
            await addOrderItem(editing.id, { product_id: item.product_id, quantity: item.quantity, price_per_unit: item.price_per_unit, total_price: item.total_price });
          }
        }
      } else {
        const res = await createOrder(data);
        const newOrderId = res.data.id;
        for (const item of orderItems) {
          await addOrderItem(newOrderId, { product_id: item.product_id, quantity: item.quantity, price_per_unit: item.price_per_unit, total_price: item.total_price });
        }
      }
      loadData(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => { if (confirm('Удалить?')) { await deleteOrder(id); loadData(); } };

  const handleMarkPaid = async (order: Order) => { try { await updateOrder(order.id, { is_paid: true }); loadData(); } catch (e) { console.error(e); } };
  const handleMarkShipped = async (order: Order) => { try { await updateOrder(order.id, { is_shipped: true, shipped_at: new Date().toISOString().split('T')[0] }); loadData(); } catch (e) { console.error(e); } };
  const handleMarkDelivered = async (order: Order) => { try { await updateOrder(order.id, { is_shipped: true, is_paid: true, shipped_at: new Date().toISOString().split('T')[0] }); loadData(); } catch (e) { console.error(e); } };

  const groupItems = (items: any[]) => {
    const map = new Map();
    for (const item of items) {
      if (map.has(item.product_id)) {
        const existing = map.get(item.product_id);
        existing.quantity += item.quantity;
        existing.total_price += item.total_price;
      } else {
        map.set(item.product_id, { ...item });
      }
    }
    return Array.from(map.values());
  };

  const openItemsModal = async (order: Order) => {
    setSelectedOrderId(order.id);
    setSelectedOrder(order);
    setShowItemsModal(true);
    setNewItemProductId(''); setNewItemQty('1'); setNewItemPrice('');
    try {
      const res = await getOrderItems(order.id);
      const prodMap = new Map(products.map((p: Product) => [p.id, p.name]));
      const items = res.data.map((item: any) => ({ ...item, product_name: prodMap.get(item.product_id) || 'ID:' + item.product_id }));
      setExistingOrderItems(groupItems(items));
    } catch (e) { console.error(e); }
  };

  const handleAddItemToExisting = async () => {
    if (!selectedOrderId || !newItemProductId || !newItemQty) return;
    try {
      await addOrderItem(selectedOrderId, { product_id: Number(newItemProductId), quantity: Number(newItemQty), price_per_unit: Number(newItemPrice) || 0, total_price: Number(newItemQty) * (Number(newItemPrice) || 0) });
      setNewItemProductId(''); setNewItemQty('1'); setNewItemPrice('');
      const res = await getOrderItems(selectedOrderId);
      const prodMap = new Map(products.map((p: Product) => [p.id, p.name]));
      const items = res.data.map((item: any) => ({ ...item, product_name: prodMap.get(item.product_id) || 'ID:' + item.product_id }));
      setExistingOrderItems(groupItems(items));
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedOrderId) return;
    try {
      await deleteOrderItem(selectedOrderId, itemId);
      const res = await getOrderItems(selectedOrderId);
      const prodMap = new Map(products.map((p: Product) => [p.id, p.name]));
      const items = res.data.map((item: any) => ({ ...item, product_name: prodMap.get(item.product_id) || 'ID:' + item.product_id }));
      setExistingOrderItems(groupItems(items));
      loadData();
    } catch (e) { console.error(e); }
  };

  const columns: ColumnConfig[] = [
    { key: '_icon', label: '', width: '30px', sortable: false, filterable: false, render: () => <FiShoppingCart size={16} /> },
    { key: 'customer_name', label: 'Клиент', filterType: 'text' },
    { key: 'order_date', label: 'Дата', filterType: 'text' },
    { key: 'total_amount', label: 'Сумма', filterType: 'text', render: (val: number) => <Badge colorScheme="green">{val.toFixed(2)} ₽</Badge> },
    { key: 'delivery_cost', label: 'Доставка', filterType: 'text', render: (val: number, row: Order) => val + (row.delivery_paid_by_customer ? ' (покупатель)' : '') },
    { key: 'is_paid', label: 'Оплачен', filterType: 'select', render: (val: boolean) => <Badge colorScheme={val ? 'green' : 'red'}>{val ? 'Да' : 'Нет'}</Badge> },
    { key: 'is_shipped', label: 'Отправлен', filterType: 'select', render: (val: boolean, row: Order) => val ? <Badge colorScheme="blue">{row.shipping_method || 'Да'} {row.shipped_at ? '(' + row.shipped_at + ')' : ''}</Badge> : <Text color="gray.400">Нет</Text> },
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: Order) => (
      <Flex gap={1} flexWrap="wrap">
        <IconButton aria-label="Позиции" icon={<FiList />} size="sm" variant="ghost" colorScheme="blue" onClick={() => openItemsModal(row)} title="Позиции" />
        {!row.is_shipped && !row.is_paid && <IconButton aria-label="Оплатить" icon={<FiCheck />} size="sm" variant="ghost" colorScheme="green" onClick={() => handleMarkPaid(row)} title="Оплатить" />}
        {!row.is_shipped && row.is_paid && <IconButton aria-label="Отправить" icon={<FiTruck />} size="sm" variant="ghost" colorScheme="orange" onClick={() => handleMarkShipped(row)} title="Отправить" />}
        {!row.is_shipped && !row.is_paid && <IconButton aria-label="Оплатить и отправить" icon={<FiPackage />} size="sm" variant="ghost" colorScheme="purple" onClick={() => handleMarkDelivered(row)} title="Оплатить и отправить" />}
        {!row.is_shipped && <IconButton aria-label="Редактировать" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} title="Редактировать" />}
        {!row.is_shipped && <IconButton aria-label="Удалить" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} title="Удалить" />}
      </Flex>
    )},
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Продажи</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Создать заказ</Button>
      </Flex>
      <Tabs>
        <TabList><Tab>Заказы</Tab><Tab><FiTrendingUp /> Аналитика</Tab></TabList>
        <TabPanels>
          <TabPanel px={0}><Card><CardBody><SortableTable columns={columns} data={orders} /></CardBody></Card></TabPanel>
          <TabPanel px={0}>
            {summary && (
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Общая выручка</Text><Text fontSize="2xl" fontWeight="bold" color="green.600">{summary.total_revenue.toFixed(2)} ₽</Text></CardBody></Card>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Расходы на доставку</Text><Text fontSize="2xl" fontWeight="bold" color="red.500">{summary.total_delivery_cost.toFixed(2)} ₽</Text></CardBody></Card>
                <Card><CardBody><Text color="gray.500" fontSize="sm">Оплаченных заказов</Text><Text fontSize="2xl" fontWeight="bold">{summary.order_count}</Text></CardBody></Card>
              </Grid>
            )}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <Card><CardBody>
                <Text fontWeight="semibold" mb={3}>Топ продуктов</Text>
                {topProducts.length > 0 ? (
                  <Table variant="simple" size="sm"><Thead><Tr><Th>Продукт</Th><Th>Кол-во</Th><Th>Выручка</Th></Tr></Thead>
                    <Tbody>{topProducts.map((p, i) => (<Tr key={i}><Td>{p.product_name}</Td><Td>{p.total_quantity}</Td><Td>{p.total_revenue.toFixed(2)} ₽</Td></Tr>))}</Tbody>
                  </Table>
                ) : <Text color="gray.500">Нет данных</Text>}
              </CardBody></Card>
              <Card><CardBody>
                <Text fontWeight="semibold" mb={3}>Топ клиентов</Text>
                {topCustomers.length > 0 ? (
                  <Table variant="simple" size="sm"><Thead><Tr><Th>Клиент</Th><Th>Заказов</Th><Th>Выручка</Th></Tr></Thead>
                    <Tbody>{topCustomers.map((c, i) => (<Tr key={i}><Td>{c.customer_name}</Td><Td>{c.order_count}</Td><Td>{c.total_revenue.toFixed(2)} ₽</Td></Tr>))}</Tbody>
                  </Table>
                ) : <Text color="gray.500">Нет данных</Text>}
              </CardBody></Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Модальное окно создания/редактирования заказа */}
      <Modal isOpen={isOpen} onClose={handleClose} size="xl"><ModalOverlay /><ModalContent maxW="900px">
        <ModalHeader>
          {editing ? (editing.is_shipped ? 'Заказ #' + editing.id + ' (закрыт)' : 'Редактировать заказ') : 'Создать заказ'}
        </ModalHeader><ModalCloseButton />
        <ModalBody pb={6}>
          {editing && editing.is_shipped ? (
            <Box>
              <Text color="orange.500" fontWeight="semibold" mb={4}>Этот заказ отправлен и закрыт. Редактирование невозможно.</Text>
              <Text fontWeight="semibold" mb={2}>Позиции заказа:</Text>
              {orderItems.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead><Tr><Th>Продукт</Th><Th>Кол</Th><Th>Цена</Th><Th>Итого</Th></Tr></Thead>
                  <Tbody>{orderItems.map(item => (
                    <Tr key={item.id}><Td>{item.product_name}</Td><Td>{item.quantity}</Td><Td>{item.price_per_unit.toFixed(0)}</Td><Td>{item.total_price.toFixed(0)}</Td></Tr>
                  ))}</Tbody>
                </Table>
              ) : <Text color="gray.500">Нет позиций</Text>}
            </Box>
          ) : (
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
              <Box display="flex" flexDirection="column" gap={3}>
                <Text fontWeight="semibold">Данные заказа</Text>
                <Box><FormLabel fontSize="sm">Клиент</FormLabel>
                  <ChakraSelect size="sm" placeholder="Выберите клиента" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </ChakraSelect>
                </Box>
                <Box><FormLabel fontSize="sm">Дата заказа</FormLabel><ChakraInput size="sm" type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} /></Box>
                <Box><FormLabel fontSize="sm">Стоимость доставки</FormLabel><ChakraInput size="sm" type="number" value={form.delivery_cost} onChange={e => setForm({ ...form, delivery_cost: e.target.value })} min="0" /></Box>
                <Checkbox size="sm" isChecked={form.delivery_paid_by_customer} onChange={e => setForm({ ...form, delivery_paid_by_customer: e.target.checked })}>Доставка оплачена покупателем</Checkbox>
                <Checkbox size="sm" isChecked={form.is_paid} onChange={e => setForm({ ...form, is_paid: e.target.checked })}>Заказ оплачен</Checkbox>
                <Checkbox size="sm" isChecked={form.is_shipped} onChange={e => setForm({ ...form, is_shipped: e.target.checked })}>Заказ отправлен</Checkbox>
                {form.is_shipped && (
                  <>
                    <Box><FormLabel fontSize="sm">Дата отправки</FormLabel><ChakraInput size="sm" type="date" value={form.shipped_at} onChange={e => setForm({ ...form, shipped_at: e.target.value })} /></Box>
                    <Box><FormLabel fontSize="sm">Способ отправки</FormLabel>
                      <ChakraSelect size="sm" placeholder="Выберите способ" value={form.shipping_method} onChange={e => setForm({ ...form, shipping_method: e.target.value })}>
                        {shippingMethods.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </ChakraSelect>
                    </Box>
                  </>
                )}
              </Box>

              <Box display="flex" flexDirection="column" gap={3}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="semibold">Позиции заказа</Text>
                  {editing && orderItems.length > 0 && <Text fontSize="sm" color="gray.500">Было: {editing.total_amount.toFixed(2)} ₽</Text>}
                </Flex>

                <Flex gap={2} align="flex-end">
                  <Box flex={2}><FormLabel fontSize="sm">Продукт</FormLabel>
                    <ChakraSelect size="sm" placeholder="Выберите" value={newItemProductId} onChange={e => handleProductSelect(e.target.value)}>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sale_price ? ' (' + p.sale_price + ' ₽)' : ''}</option>)}
                    </ChakraSelect>
                  </Box>
                  <Box w="70px"><FormLabel fontSize="sm">Кол-во</FormLabel><ChakraInput size="sm" type="number" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} min="1" /></Box>
                  <Box w="90px"><FormLabel fontSize="sm">Цена</FormLabel><ChakraInput size="sm" type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} min="0" /></Box>
                  <Button size="sm" colorScheme="green" onClick={handleAddItemToForm}>+</Button>
                </Flex>

                {newItemProductId && (productMaterials.length > 0 || productEquipment.length > 0) && (
                  <Box p={2} bg="gray.50" borderRadius="md">
                    <Text fontSize="xs" color="gray.500" mb={1}>Списание на 1 ед.:</Text>
                    {productMaterials.map((m: any) => (<Badge key={m.id} mr={1} mb={1} colorScheme="blue" fontSize="xs">{m.name}: {m.quantity} {m.unit_name || ''}</Badge>))}
                    {productEquipment.map((eq: any) => (
                      <Box key={eq.id} mb={1}>
                        <Badge mr={1} colorScheme="orange" fontSize="xs">{eq.name}: амортизация {eq.depreciation_per_unit.toFixed(2)} ₽</Badge>
                        {eq.supplies?.map((s: any) => (<Badge key={s.material_id} mr={1} colorScheme="red" fontSize="xs">{s.name}: -{s.consumption_per_unit} {s.resource_type}</Badge>))}
                      </Box>
                    ))}
                  </Box>
                )}

                {orderItems.length > 0 ? (
                  <Box maxH="200px" overflowY="auto">
                    <Table variant="simple" size="sm">
                      <Thead><Tr><Th>Продукт</Th><Th>Кол</Th><Th>Цена</Th><Th>Итого</Th><Th></Th></Tr></Thead>
                      <Tbody>{orderItems.map(item => (
                        <Tr key={item.id}>
                          <Td fontSize="xs">{item.product_name}</Td><Td fontSize="xs">{item.quantity}</Td>
                          <Td fontSize="xs">{item.price_per_unit.toFixed(0)}</Td><Td fontSize="xs">{item.total_price.toFixed(0)}</Td>
                          <Td><IconButton aria-label="Remove" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveItemFromForm(item.id)} /></Td>
                        </Tr>
                      ))}</Tbody>
                    </Table>
                    <Flex justify="flex-end" mt={2} direction="column" align="flex-end">
                      <Badge colorScheme="green" fontSize="md">Итого: {orderItems.reduce((s, i) => s + i.total_price, 0).toFixed(2)} ₽</Badge>
                      {editing && orderItems.reduce((s, i) => s + i.total_price, 0) > editing.total_amount && (
                        <Badge colorScheme="orange" fontSize="sm" mt={1}>Доплата: +{(orderItems.reduce((s, i) => s + i.total_price, 0) - editing.total_amount).toFixed(2)} ₽</Badge>
                      )}
                    </Flex>
                  </Box>
                ) : (
                  <Text color="gray.400" fontSize="sm">Нет позиций</Text>
                )}
              </Box>
            </Grid>
          )}

          {(!editing || !editing.is_shipped) && (
            <Flex justify="flex-end" mt={4}>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {editing ? 'Сохранить' : 'Создать заказ (' + orderItems.length + ' поз.)'}
              </Button>
            </Flex>
          )}
        </ModalBody>
      </ModalContent></Modal>

      {/* Модальное окно позиций для существующего заказа */}
      <Modal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} size="xl">
        <ModalOverlay /><ModalContent>
          <ModalHeader>
            {selectedOrder && selectedOrder.is_shipped ? 'Заказ #' + selectedOrderId + ' (закрыт)' : 'Позиции заказа #' + selectedOrderId}
          </ModalHeader><ModalCloseButton />
          <ModalBody pb={6}>
            {selectedOrder && selectedOrder.is_shipped ? (
              <Box>
                <Text color="orange.500" fontWeight="semibold" mb={4}>Этот заказ отправлен и закрыт. Редактирование невозможно.</Text>
                {existingOrderItems.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead><Tr><Th>Продукт</Th><Th>Кол-во</Th><Th>Цена</Th><Th>Итого</Th></Tr></Thead>
                    <Tbody>{existingOrderItems.map(item => (
                      <Tr key={item.product_id}><Td>{item.product_name}</Td><Td>{item.quantity}</Td><Td>{item.price_per_unit.toFixed(2)} ₽</Td><Td>{item.total_price.toFixed(2)} ₽</Td></Tr>
                    ))}</Tbody>
                  </Table>
                ) : <Text color="gray.500">Нет позиций</Text>}
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={4}>
                <Flex gap={2} align="flex-end">
                  <Box flex={2}><FormLabel>Продукт</FormLabel>
                    <ChakraSelect placeholder="Выберите продукт" value={newItemProductId} onChange={e => { setNewItemProductId(e.target.value); handleProductSelect(e.target.value); if (e.target.value) { const p = products.find(x => x.id === Number(e.target.value)); if (p?.sale_price) setNewItemPrice(String(p.sale_price)); } }}>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sale_price ? ' (' + p.sale_price + ' ₽)' : ''}</option>)}
                    </ChakraSelect>
                  </Box>
                  <Box flex={1}><FormLabel>Кол-во</FormLabel><ChakraInput type="number" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} min="1" /></Box>
                  <Box flex={1}><FormLabel>Цена за ед.</FormLabel><ChakraInput type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} min="0" /></Box>
                  <Button colorScheme="green" onClick={handleAddItemToExisting}>+</Button>
                </Flex>
                {existingOrderItems.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead><Tr><Th>Продукт</Th><Th>Кол-во</Th><Th>Цена</Th><Th>Итого</Th><Th></Th></Tr></Thead>
                    <Tbody>{existingOrderItems.map(item => (
                      <Tr key={item.id}><Td>{item.product_name}</Td><Td>{item.quantity}</Td><Td>{item.price_per_unit.toFixed(2)} ₽</Td><Td>{item.total_price.toFixed(2)} ₽</Td>
                        <Td><IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDeleteItem(item.id)} /></Td>
                      </Tr>
                    ))}</Tbody>
                  </Table>
                ) : <Text color="gray.500">Нет позиций</Text>}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Sales;