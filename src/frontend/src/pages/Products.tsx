import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, Badge, useDisclosure, FormLabel, Tabs, TabList, TabPanels, Tab, TabPanel,
  Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiList, FiTool, FiPrinter, FiBox, FiSave, FiX } from 'react-icons/fi';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getMaterials, getEquipment, getProductSpecification,
  addMaterialToSpecification, addEquipmentToSpecification,
  updateMaterialSpec, updateEquipmentSpec, removeFromSpecification
} from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Product { id: number; name: string; sale_price?: number | null; }
interface Material { id: number; name: string; current_stock: number; average_cost: number; unit_name: string; material_type?: string; }
interface Equipment { id: number; name: string; }
interface SpecItem { id: number; type: 'material' | 'equipment'; name: string; unit_name?: string; quantity?: number; depreciation_per_unit?: number; cost: number; }

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productCosts, setProductCosts] = useState<Record<number, number>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ name: '', sale_price: '' });

  const [showSpecModal, setShowSpecModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [specItems, setSpecItems] = useState<SpecItem[]>([]);
  const [specTotalCost, setSpecTotalCost] = useState(0);
  const [newMatId, setNewMatId] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatSearch, setNewMatSearch] = useState('');
  const [showMatDropdown, setShowMatDropdown] = useState(false);
  const [newEqId, setNewEqId] = useState('');
  const [newEqDepreciation, setNewEqDepreciation] = useState('');
  const [editingSpecItem, setEditingSpecItem] = useState<number | null>(null);
  const [editSpecValue, setEditSpecValue] = useState('');

  const filteredMaterials = useMemo(() => {
    if (!newMatSearch) return materials;
    const q = newMatSearch.toLowerCase();
    return materials.filter(m => m.name.toLowerCase().includes(q));
  }, [materials, newMatSearch]);

  const [showViewSpecModal, setShowViewSpecModal] = useState(false);
  const [viewSpecItems, setViewSpecItems] = useState<SpecItem[]>([]);
  const [viewSpecTotalCost, setViewSpecTotalCost] = useState(0);
  const [viewProductName, setViewProductName] = useState('');
  const [viewProductId, setViewProductId] = useState(0);

  useEffect(() => { fetchData(); fetchMaterials(); fetchEquipment(); }, []);

  const fetchData = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
      const costs: Record<number, number> = {};
      for (const p of res.data) {
        try { const sr = await getProductSpecification(p.id); costs[p.id] = sr.data.total_cost || 0; }
        catch (e) { costs[p.id] = 0; }
      }
      setProductCosts(costs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMaterials = async () => { try { setMaterials((await getMaterials({ material_type: 'common' })).data); } catch (e) { console.error(e); } };
  const fetchEquipment = async () => { try { setEquipment((await getEquipment()).data); } catch (e) { console.error(e); } };

  const handleOpen = (product?: Product) => { setEditing(product || null); setForm(product ? { name: product.name, sale_price: product.sale_price ? String(product.sale_price) : '' } : { name: '', sale_price: '' }); onOpen(); };
  const handleClose = () => { onClose(); setEditing(null); };
  const handleSubmit = async () => { try { const data = { name: form.name, sale_price: form.sale_price ? Number(form.sale_price) : null }; if (editing) await updateProduct(editing.id, data); else await createProduct(data); fetchData(); handleClose(); } catch (e) { console.error(e); } };
  const handleDelete = async (id: number) => { if (confirm('Удалить?')) { await deleteProduct(id); fetchData(); } };

  const openViewSpec = async (product: Product) => {
    setViewProductName(product.name); setViewProductId(product.id); setShowViewSpecModal(true);
    try { const res = await getProductSpecification(product.id); setViewSpecItems(res.data.items || []); setViewSpecTotalCost(res.data.total_cost || 0); } catch (e) { console.error(e); }
  };

  const openEditSpec = async (product: Product) => {
    setSelectedProduct(product); setShowSpecModal(true);
    setNewMatId(''); setNewMatQty(''); setNewMatSearch(''); setShowMatDropdown(false);
    setNewEqId(''); setNewEqDepreciation('');
    try { const res = await getProductSpecification(product.id); setSpecItems(res.data.items || []); setSpecTotalCost(res.data.total_cost || 0); } catch (e) { console.error(e); }
  };

  const handleAddMaterial = async () => {
    if (!selectedProduct || !newMatId || !newMatQty) return;
    try {
      await addMaterialToSpecification(selectedProduct.id, { material_id: Number(newMatId), quantity: Number(newMatQty) });
      setNewMatId(''); setNewMatQty(''); setNewMatSearch(''); setShowMatDropdown(false);
      const res = await getProductSpecification(selectedProduct.id);
      setSpecItems(res.data.items || []); setSpecTotalCost(res.data.total_cost || 0);
      setProductCosts(prev => ({ ...prev, [selectedProduct.id]: res.data.total_cost || 0 }));
    } catch (e) { console.error(e); }
  };

  const handleAddEquipment = async () => {
    if (!selectedProduct || !newEqId) return;
    try {
      await addEquipmentToSpecification(selectedProduct.id, { equipment_id: Number(newEqId), depreciation_per_unit: Number(newEqDepreciation) || 0 });
      setNewEqId(''); setNewEqDepreciation('');
      const res = await getProductSpecification(selectedProduct.id);
      setSpecItems(res.data.items || []); setSpecTotalCost(res.data.total_cost || 0);
      setProductCosts(prev => ({ ...prev, [selectedProduct.id]: res.data.total_cost || 0 }));
    } catch (e) { console.error(e); }
  };

  const handleRemoveItem = async (type: string, specId: number) => {
    if (!selectedProduct) return;
    try {
      await removeFromSpecification(selectedProduct.id, type, specId);
      const res = await getProductSpecification(selectedProduct.id);
      setSpecItems(res.data.items || []); setSpecTotalCost(res.data.total_cost || 0);
      setProductCosts(prev => ({ ...prev, [selectedProduct.id]: res.data.total_cost || 0 }));
    } catch (e) { console.error(e); }
  };

  const startEditSpecItem = (item: SpecItem) => {
    setEditingSpecItem(item.id);
    setEditSpecValue(item.type === 'material' ? String(item.quantity ?? '') : String(item.depreciation_per_unit ?? ''));
  };

  const saveEditSpecItem = async (item: SpecItem) => {
    if (!selectedProduct || !editSpecValue) return;
    try {
      if (item.type === 'material') {
        await updateMaterialSpec(selectedProduct.id, item.id, { quantity: Number(editSpecValue) });
      } else {
        await updateEquipmentSpec(selectedProduct.id, item.id, { depreciation_per_unit: Number(editSpecValue) });
      }
      setEditingSpecItem(null); setEditSpecValue('');
      const res = await getProductSpecification(selectedProduct.id);
      setSpecItems(res.data.items || []); setSpecTotalCost(res.data.total_cost || 0);
      setProductCosts(prev => ({ ...prev, [selectedProduct.id]: res.data.total_cost || 0 }));
    } catch (e) { console.error(e); }
  };

  const cancelEditSpecItem = () => {
    setEditingSpecItem(null); setEditSpecValue('');
  };

  const handlePrintSpec = () => {
    const printContent = document.getElementById('printable-spec');
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Спецификация: ${viewProductName}</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{font-size:24px;margin-bottom:5px;color:#1a365d}.subtitle{color:#666;margin-bottom:20px;font-size:14px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:14px}th{background:#f7fafc;font-weight:600}.section-title{font-size:16px;font-weight:600;margin:20px 0 10px;color:#2d3748;border-bottom:2px solid #e2e8f0;padding-bottom:5px}.total-cost{font-size:18px;font-weight:bold;color:#276749;text-align:right;margin-top:10px;padding:10px;background:#f0fff4;border-radius:6px}.footer{margin-top:30px;font-size:12px;color:#999;text-align:center}@media print{body{padding:0}.no-print{display:none!important}}</style></head><body>${printContent.innerHTML}<div class="footer">Система учёта — Спецификация продукта</div></body></html>`);
    printWindow.document.close(); printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const columns: ColumnConfig[] = [
    { key: '_icon', label: '', width: '30px', sortable: false, filterable: false, render: () => <FiBox size={16} /> },
    { key: 'name', label: 'Название', filterType: 'text' },
    { key: 'sale_price', label: 'Цена продажи', filterType: 'text', render: (val: number | null) => val ? <Badge colorScheme="blue">{val.toFixed(2)} ₽</Badge> : <Text color="gray.400">-</Text> },
    { key: 'cost_display', label: 'Себестоимость', filterType: 'text', render: (_: any, row: Product) => (
      <Badge colorScheme={productCosts[row.id] > 0 ? 'green' : 'gray'}>{productCosts[row.id] > 0 ? `${productCosts[row.id].toFixed(2)} ₽` : '-'}</Badge>
    )},
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: Product) => (
      <Flex gap={1}>
        <IconButton aria-label="View spec" icon={<FiList />} size="sm" variant="ghost" colorScheme="blue" onClick={() => openViewSpec(row)} title="Спецификация" />
        <IconButton aria-label="Edit spec" icon={<FiPackage />} size="sm" variant="ghost" colorScheme="green" onClick={() => openEditSpec(row)} title="Редактировать спецификацию" />
        <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} />
        <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} />
      </Flex>
    )},
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Продукты</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить продукт</Button>
      </Flex>
      <Card><CardBody>
        <SortableTable columns={columns} data={products.map(p => ({ ...p, cost_display: productCosts[p.id] || 0 }))} />
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay /><ModalContent>
          <ModalHeader>{editing ? 'Редактировать' : 'Добавить продукт'}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}><Box display="flex" flexDirection="column" gap={4}>
            <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Box>
            <Box><FormLabel>Цена продажи (₽)</FormLabel><ChakraInput type="number" placeholder="Введите цену продажи" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} min="0" /></Box>
            <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
          </Box></ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={showViewSpecModal} onClose={() => setShowViewSpecModal(false)} size="lg">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Спецификация: {viewProductName}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}>
            <div id="printable-spec">
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a365d', marginBottom: '5px' }}>{viewProductName}</h1>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Спецификация продукта | ID: {viewProductId} | Дата: {new Date().toLocaleDateString('ru-RU')}</p>
              {viewSpecItems.filter(i => i.type === 'material').length > 0 && (
                <>
                  <div style={{ fontSize: '16px', fontWeight: '600', margin: '20px 0 10px', color: '#2d3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' }}>Материалы для сборки</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead><tr><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>✓</th><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>Название</th><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>Количество</th><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>Ед.</th></tr></thead>
                    <tbody>{viewSpecItems.filter(i => i.type === 'material').map(item => (
                      <tr key={`mat-${item.id}`}><td style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'center', fontSize: '16px' }}>☐</td><td style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: '14px' }}>{item.name}</td><td style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: '14px' }}>{item.quantity}</td><td style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: '14px' }}>{item.unit_name || '-'}</td></tr>
                    ))}</tbody>
                  </table>
                </>
              )}
              {viewSpecItems.filter(i => i.type === 'equipment').length > 0 && (
                <>
                  <div style={{ fontSize: '16px', fontWeight: '600', margin: '20px 0 10px', color: '#2d3748', borderBottom: '2px solid #e2e8f0', paddingBottom: '5px' }}>Оборудование</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead><tr><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>✓</th><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>Название</th><th style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'left', background: '#f7fafc', fontSize: '14px' }}>Амортизация</th></tr></thead>
                    <tbody>{viewSpecItems.filter(i => i.type === 'equipment').map(item => (
                      <tr key={`eq-${item.id}`}><td style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'center', fontSize: '16px' }}>☐</td><td style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: '14px' }}>{item.name}</td><td style={{ border: '1px solid #ddd', padding: '8px 12px', fontSize: '14px' }}>{item.cost.toFixed(2)} ₽</td></tr>
                    ))}</tbody>
                  </table>
                </>
              )}
              {viewSpecItems.length === 0 && <p style={{ color: '#999' }}>Спецификация пуста</p>}
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#276749', textAlign: 'right', marginTop: '10px', padding: '10px', background: '#f0fff4', borderRadius: '6px' }}>Себестоимость: {viewSpecTotalCost.toFixed(2)} ₽</div>
            </div>
            <Flex gap={3} mt={4} className="no-print">
              <Button colorScheme="blue" leftIcon={<FiPrinter />} onClick={handlePrintSpec}>Печать (чек-лист)</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={showSpecModal} onClose={() => setShowSpecModal(false)} size="xl">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Спецификация: {selectedProduct?.name}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs>
              <TabList><Tab><FiPackage /> Материалы</Tab><Tab><FiTool /> Оборудование</Tab></TabList>
              <TabPanels>
                <TabPanel>
                  <Box display="flex" flexDirection="column" gap={4}>
                    <Flex gap={2} align="flex-end">
                      <Box flex={2} position="relative"><FormLabel>Материал</FormLabel>
                        <ChakraInput
                          placeholder="Поиск материала..."
                          value={newMatSearch}
                          onChange={e => { setNewMatSearch(e.target.value); setNewMatId(''); setShowMatDropdown(true); }}
                          onFocus={() => setShowMatDropdown(true)}
                          onBlur={() => setTimeout(() => setShowMatDropdown(false), 200)}
                        />
                        {showMatDropdown && (
                          <Box
                            position="absolute" left={0} right={0} top="100%" zIndex={10}
                            bg="white" borderWidth={1} borderColor="gray.200" borderRadius="md"
                            boxShadow="lg" maxH="200px" overflowY="auto"
                          >
                            {filteredMaterials.length > 0 ? filteredMaterials.map(m => (
                              <Box
                                key={m.id} px={3} py={2} cursor="pointer" fontSize="sm"
                                _hover={{ bg: 'blue.50' }}
                                bg={newMatId === String(m.id) ? 'blue.50' : undefined}
                                onMouseDown={() => { setNewMatId(String(m.id)); setNewMatSearch(m.name); setShowMatDropdown(false); }}
                              >
                                <Text fontWeight="medium">{m.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  Остаток: {m.current_stock} {m.unit_name} | Цена: {m.average_cost.toFixed(2)} ₽
                                </Text>
                              </Box>
                            )) : (
                              <Text px={3} py={2} color="gray.400" fontSize="sm">Ничего не найдено</Text>
                            )}
                          </Box>
                        )}
                      </Box>
                      <Box flex={1}><FormLabel>Кол-во</FormLabel>
                        <ChakraInput type="number" value={newMatQty} onChange={e => setNewMatQty(e.target.value)} min="0" />
                      </Box>
                      <Button colorScheme="green" onClick={handleAddMaterial} alignSelf="flex-end">+</Button>
                    </Flex>
                    {specItems.filter(i => i.type === 'material').length > 0 && (
                      <Table variant="simple" size="sm">
                        <Thead><Tr><Th>Материал</Th><Th>Кол-во</Th><Th>Ед.</Th><Th>Стоимость</Th><Th></Th></Tr></Thead>
                        <Tbody>{specItems.filter(i => i.type === 'material').map(item => (
                          <Tr key={`mat-${item.id}`}>
                            <Td>{item.name}</Td>
                            <Td>{editingSpecItem === item.id ? (
                              <ChakraInput type="number" size="xs" value={editSpecValue} onChange={e => setEditSpecValue(e.target.value)} min="0" w="80px" />
                            ) : item.quantity}</Td>
                            <Td>{item.unit_name || '-'}</Td>
                            <Td>{item.cost.toFixed(2)} ₽</Td>
                            <Td>
                              {editingSpecItem === item.id ? (
                                <Flex gap={1}>
                                  <IconButton aria-label="Save" icon={<FiSave />} size="xs" variant="ghost" colorScheme="green" onClick={() => saveEditSpecItem(item)} />
                                  <IconButton aria-label="Cancel" icon={<FiX />} size="xs" variant="ghost" onClick={cancelEditSpecItem} />
                                </Flex>
                              ) : (
                                <Flex gap={1}>
                                  <IconButton aria-label="Edit" icon={<FiEdit2 />} size="xs" variant="ghost" colorScheme="blue" onClick={() => startEditSpecItem(item)} />
                                  <IconButton aria-label="Remove" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveItem('material', item.id)} />
                                </Flex>
                              )}
                            </Td>
                          </Tr>
                        ))}</Tbody>
                      </Table>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Box display="flex" flexDirection="column" gap={4}>
                    <Flex gap={2} align="flex-end">
                      <Box flex={2}><FormLabel>Оборудование</FormLabel>
                        <ChakraSelect placeholder="Выберите оборудование" value={newEqId} onChange={e => setNewEqId(e.target.value)}>
                          {equipment.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </ChakraSelect>
                      </Box>
                      <Box flex={1}><FormLabel>Амортизация (₽)</FormLabel>
                        <ChakraInput type="number" value={newEqDepreciation} onChange={e => setNewEqDepreciation(e.target.value)} min="0" />
                      </Box>
                      <Button colorScheme="green" onClick={handleAddEquipment} alignSelf="flex-end">+</Button>
                    </Flex>
                    {specItems.filter(i => i.type === 'equipment').length > 0 && (
                      <Table variant="simple" size="sm">
                        <Thead><Tr><Th>Оборудование</Th><Th>Амортизация</Th><Th></Th></Tr></Thead>
                        <Tbody>{specItems.filter(i => i.type === 'equipment').map(item => (
                          <Tr key={`eq-${item.id}`}>
                            <Td>{item.name}</Td>
                            <Td>{editingSpecItem === item.id ? (
                              <ChakraInput type="number" size="xs" value={editSpecValue} onChange={e => setEditSpecValue(e.target.value)} min="0" w="100px" />
                            ) : `${item.cost.toFixed(2)} ₽`}</Td>
                            <Td>
                              {editingSpecItem === item.id ? (
                                <Flex gap={1}>
                                  <IconButton aria-label="Save" icon={<FiSave />} size="xs" variant="ghost" colorScheme="green" onClick={() => saveEditSpecItem(item)} />
                                  <IconButton aria-label="Cancel" icon={<FiX />} size="xs" variant="ghost" onClick={cancelEditSpecItem} />
                                </Flex>
                              ) : (
                                <Flex gap={1}>
                                  <IconButton aria-label="Edit" icon={<FiEdit2 />} size="xs" variant="ghost" colorScheme="blue" onClick={() => startEditSpecItem(item)} />
                                  <IconButton aria-label="Remove" icon={<FiTrash2 />} size="xs" variant="ghost" colorScheme="red" onClick={() => handleRemoveItem('equipment', item.id)} />
                                </Flex>
                              )}
                            </Td>
                          </Tr>
                        ))}</Tbody>
                      </Table>
                    )}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Box bg="green.50" p={3} borderRadius="md" mt={4}>
              <Flex justify="space-between"><Text fontWeight="bold">Себестоимость:</Text><Text fontWeight="bold" color="green.600">{specTotalCost.toFixed(2)} ₽</Text></Flex>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Products;

