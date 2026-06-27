import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, Badge, useDisclosure, FormLabel,
  Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiExternalLink, FiSearch, FiX } from 'react-icons/fi';
import {
  getMaterials, createMaterial, updateMaterial, deleteMaterial, getUnitTypes,
  getMaterialBatches, addMaterialBatch
} from '../api';
import { getCategories } from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Material {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
  unit_id: number;
  unit_name: string | null;
  url: string | null;
  article: string | null;
  current_stock: number;
  min_stock: number | null;
  average_cost: number;
  material_type: 'common' | 'equipment_supply';
}

interface Category { id: number; name: string; parent_id: number | null; }
interface UnitType { id: number; name: string; }
interface Batch {
  id: number;
  quantity: number;
  total_cost: number;
  cost_per_unit: number;
  purchase_date: string;
}

function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [parentCat, setParentCat] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const parentCategories = categories.filter(c => c.parent_id === null);
  const childCategories = categories.filter(c => String(c.parent_id) === parentCat);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    name: '', category_id: '', unit_id: '', url: '', article: '', min_stock: '', material_type: 'common'
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchMaterialId, setBatchMaterialId] = useState<number | null>(null);
  const [batchMaterialName, setBatchMaterialName] = useState('');
  const [batchQuantity, setBatchQuantity] = useState('');
  const [batchTotalCost, setBatchTotalCost] = useState('');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchCategories(); fetchUnitTypes(); }, []);
  useEffect(() => { fetchData(); }, [filterCategory, filterType, searchQuery]);

  const fetchUnitTypes = async () => {
    try { setUnitTypes((await getUnitTypes()).data); }
    catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    try {
      const params: any = {};
      if (filterCategory) params.category_id = filterCategory;
      if (filterType) params.material_type = filterType;
      if (searchQuery) params.search = searchQuery;
      const res = await getMaterials(params);
      setMaterials(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { setCategories((await getCategories()).data); }
    catch (e) { console.error(e); }
  };

  const handleOpen = async (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name, category_id: String(material.category_id || ''),
        unit_id: String(material.unit_id), url: material.url || '',
        article: material.article || '', min_stock: String(material.min_stock || ''),
        material_type: material.material_type || 'common'
      });
      const cat = categories.find(c => c.id === material.category_id);
      if (cat && cat.parent_id) {
        setParentCat(String(cat.parent_id));
      } else if (cat) {
        setParentCat(String(cat.id));
        setFormData(prev => ({ ...prev, category_id: '' }));
      } else {
        setParentCat('');
      }
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', category_id: '', unit_id: '', url: '', article: '', min_stock: '', material_type: 'common' });
      setParentCat('');
    }
    onOpen();
  };

  const handleClose = () => { onClose(); setEditingMaterial(null); };

  const handleSubmit = async () => {
    try {
      const catId = formData.category_id
        ? Number(formData.category_id)
        : (parentCat ? Number(parentCat) : null);
      const data = {
        ...formData,
        category_id: catId,
        unit_id: Number(formData.unit_id),
        min_stock: formData.min_stock ? Number(formData.min_stock) : null,
        material_type: formData.material_type,
      };
      if (editingMaterial) await updateMaterial(editingMaterial.id, data);
      else await createMaterial(data);
      fetchData(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить?')) { await deleteMaterial(id); fetchData(); }
  };

  const openBatchModal = async (materialId: number, materialName: string) => {
    setBatchMaterialId(materialId); setBatchMaterialName(materialName);
    setBatchQuantity(''); setBatchTotalCost('');
    setBatchDate(new Date().toISOString().split('T')[0]);
    setShowBatchModal(true);
    try { setBatches((await getMaterialBatches(materialId)).data); }
    catch (e) { console.error(e); }
  };

  const handleAddBatch = async () => {
    if (!batchMaterialId || !batchQuantity || !batchTotalCost) return;
    try {
      await addMaterialBatch(batchMaterialId, { quantity: Number(batchQuantity), total_cost: Number(batchTotalCost), purchase_date: batchDate });
      setShowBatchModal(false); fetchData();
    } catch (e) { console.error(e); }
  };

  const batchCostPerUnit = batchQuantity && batchTotalCost ? (Number(batchTotalCost) / Number(batchQuantity)).toFixed(2) : '0';

  const columns: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px', filterType: 'text' },
    { key: 'name', label: 'Название', filterType: 'text', render: (val: string, row: Material) => (
      <Flex align="center" gap={2}>
        {val}
        {row.url && <a href={row.url} target="_blank" rel="noopener noreferrer"><FiExternalLink color="blue" /></a>}
      </Flex>
    )},
    { key: 'category_name', label: 'Категория', filterType: 'select' },
    { key: 'material_type', label: 'Тип', filterType: 'select', render: (val: string) => (
      <Badge colorScheme={val === 'equipment_supply' ? 'orange' : 'blue'} fontSize="xs">
        {val === 'equipment_supply' ? 'Расходник' : 'Обычный'}
      </Badge>
    )},
    { key: 'unit_name', label: 'Ед. изм.', filterType: 'select' },
    { key: 'article', label: 'Артикул', filterType: 'text' },
    { key: 'current_stock', label: 'Остаток', filterType: 'text', render: (val: number, row: Material) => (
      <Badge colorScheme={row.min_stock && val < row.min_stock ? 'red' : 'green'}>{val} {row.unit_name || ''}</Badge>
    )},
    { key: 'average_cost', label: 'Ср. стоимость', filterType: 'text', render: (val: number) => `${val.toFixed(2)} ₽` },
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: Material) => (
      <Flex gap={1}>
        <IconButton aria-label="Add batch" icon={<FiPackage />} size="sm" variant="ghost" colorScheme="green" onClick={() => openBatchModal(row.id, row.name)} title="Закупка" />
        <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} title="Редактировать" />
        <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} title="Удалить" />
      </Flex>
    )},
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} gap={4}>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">Материалы</Text>
        <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
          <ChakraSelect placeholder="Все категории" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); }} w={{ base: '100%', md: '200px' }}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </ChakraSelect>
          <ChakraSelect placeholder="Все типы" value={filterType} onChange={(e) => { setFilterType(e.target.value); }} w={{ base: '100%', md: '150px' }}>
            <option value="common">Обычные</option>
            <option value="equipment_supply">Расходники оборудования</option>
          </ChakraSelect>
          <Box position="relative" w={{ base: '100%', md: '250px' }}>
            <ChakraInput placeholder="Поиск по названию или артикулу..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} pl={8} pr={8} />
            <Box position="absolute" left={2} top="50%" transform="translateY(-50%)" color="gray.400"><FiSearch /></Box>
            {searchQuery && (
              <IconButton aria-label="Очистить поиск" icon={<FiX />} size="xs" variant="ghost" position="absolute" right={1} top="50%" transform="translateY(-50%)" onClick={() => setSearchQuery('')} />
            )}
          </Box>
          <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()} w={{ base: '100%', md: 'auto' }}>Добавить</Button>
        </Flex>
      </Flex>
      <Card><CardBody overflowX="auto">
        <SortableTable columns={columns} data={materials} size="md" />
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalOverlay /><ModalContent>
          <ModalHeader>{editingMaterial ? 'Редактировать материал' : 'Добавить материал'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Box>
              <Box><FormLabel>Группа категории</FormLabel><ChakraSelect placeholder="Выберите группу" value={parentCat} onChange={e => { setParentCat(e.target.value); setFormData({ ...formData, category_id: '' }); }}>{parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ChakraSelect></Box>
              <Box><FormLabel>Подкатегория</FormLabel><ChakraSelect placeholder={parentCat ? 'Выберите подкатегорию' : 'Сначала выберите группу'} value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} isDisabled={!parentCat}>{childCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</ChakraSelect></Box>
              <Box><FormLabel>Тип материала</FormLabel><ChakraSelect value={formData.material_type} onChange={e => setFormData({ ...formData, material_type: e.target.value })}><option value="common">Обычный материал</option><option value="equipment_supply">Расходник оборудования</option></ChakraSelect></Box>
              <Box><FormLabel>Единица измерения</FormLabel><ChakraSelect placeholder="Выберите единицу измерения" value={formData.unit_id} onChange={e => setFormData({ ...formData, unit_id: e.target.value })}>{unitTypes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</ChakraSelect></Box>
              <Box><FormLabel>Ссылка на сайт</FormLabel><ChakraInput placeholder="https://..." value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} /></Box>
              <Box><FormLabel>Артикул</FormLabel><ChakraInput placeholder="Артикул товара" value={formData.article} onChange={e => setFormData({ ...formData, article: e.target.value })} /></Box>
              <Box><FormLabel>Минимальный остаток</FormLabel><ChakraInput placeholder="Введите мин. остаток" value={formData.min_stock} onChange={e => setFormData({ ...formData, min_stock: e.target.value })} /></Box>
              <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} size="lg">
        <ModalOverlay /><ModalContent>
          <ModalHeader>Закупка: {batchMaterialName}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Flex gap={4}>
                <Box flex={1}><FormLabel>Количество ({materials.find(m => m.id === batchMaterialId)?.unit_name || 'ед.'})</FormLabel><ChakraInput type="number" placeholder="Например: 100" value={batchQuantity} onChange={e => setBatchQuantity(e.target.value)} min="0" /></Box>
                <Box flex={1}><FormLabel>Дата закупки</FormLabel><ChakraInput type="date" value={batchDate} onChange={e => setBatchDate(e.target.value)} /></Box>
              </Flex>
              <Box><FormLabel>Общая стоимость (₽)</FormLabel><ChakraInput type="number" placeholder="Например: 500" value={batchTotalCost} onChange={e => setBatchTotalCost(e.target.value)} min="0" /></Box>
              {batchQuantity && batchTotalCost && <Box bg="blue.50" p={3} borderRadius="md"><Text fontWeight="bold">Цена за единицу: {batchCostPerUnit} ₽</Text></Box>}
              <Button colorScheme="green" onClick={handleAddBatch} isDisabled={!batchQuantity || !batchTotalCost}>Добавить закупку</Button>
              {batches.length > 0 && (
                <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Text fontWeight="bold" mb={3}>История закупок</Text>
                  <Table variant="simple" size="sm">
                    <Thead><Tr><Th>Дата</Th><Th>Кол-во</Th><Th>Общая стоимость</Th><Th>Цена за ед.</Th></Tr></Thead>
                    <Tbody>{batches.map(b => (<Tr key={b.id}><Td>{b.purchase_date}</Td><Td>{b.quantity}</Td><Td>{b.total_cost.toFixed(2)} ₽</Td><Td>{b.cost_per_unit.toFixed(2)} ₽</Td></Tr>))}</Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Materials;

