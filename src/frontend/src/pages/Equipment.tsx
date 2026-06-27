import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, Badge, useDisclosure, FormLabel, Progress, Alert, AlertIcon
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import {
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
  getMaterials, addEquipmentSpecification, removeEquipmentSpecification,
  replenishEquipmentResource
} from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface EquipmentItem {
  id: number;
  name: string;
  cost: number;
  specifications: EquipmentSpec[];
}

interface EquipmentSpec {
  id: number;
  material_id: number;
  material_name: string;
  resource_type: string;
  total_resource: number;
  current_resource: number;
  min_resource: number;
  consumption_per_unit: number;
}

interface Material { id: number; name: string; unit_name: string; material_type?: string; }

function Equipment() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ name: '', cost: '' });

  // Спецификация
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [selectedEquipmentName, setSelectedEquipmentName] = useState('');
  const [specs, setSpecs] = useState<EquipmentSpec[]>([]);
  const [newMatId, setNewMatId] = useState('');
  const [newResourceType, setNewResourceType] = useState('percent');
  const [newTotalResource, setNewTotalResource] = useState('100');
  const [newCurrentResource, setNewCurrentResource] = useState('100');
  const [newMinResource, setNewMinResource] = useState('10');
  const [newConsumption, setNewConsumption] = useState('');

  // Пополнение ресурса
  const [replenishAmount, setReplenishAmount] = useState<Record<number, string>>({});

  useEffect(() => { fetchData(); fetchMaterials(); }, []);

  const fetchData = async () => {
    try { setItems((await getEquipment()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials({ material_type: 'equipment_supply' });
      setMaterials(res.data);
    }
    catch (e) { console.error(e); }
  };

  const handleOpen = (item?: EquipmentItem) => {
    setEditing(item || null);
    setForm(item ? { name: item.name, cost: String(item.cost) } : { name: '', cost: '' });
    onOpen();
  };

  const handleClose = () => { onClose(); setEditing(null); };

  const handleSubmit = async () => {
    try {
      const data = { name: form.name, cost: Number(form.cost) };
      if (editing) await updateEquipment(editing.id, data);
      else await createEquipment(data);
      fetchData();
      handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить?')) { await deleteEquipment(id); fetchData(); }
  };

  const openSpecModal = (equipmentId: number, equipmentName: string) => {
    setSelectedEquipmentId(equipmentId);
    setSelectedEquipmentName(equipmentName);
    const item = items.find(i => i.id === equipmentId);
    setSpecs(item?.specifications || []);
    setShowSpecModal(true);
    setNewMatId('');
    setNewResourceType('percent');
    setNewTotalResource('100');
    setNewCurrentResource('100');
    setNewMinResource('10');
    setNewConsumption('');
  };

  const handleAddSpec = async () => {
    if (!selectedEquipmentId || !newMatId) return;
    try {
      await addEquipmentSpecification(selectedEquipmentId, {
        material_id: Number(newMatId),
        resource_type: newResourceType,
        total_resource: Number(newTotalResource),
        current_resource: Number(newCurrentResource),
        min_resource: Number(newMinResource),
        consumption_per_unit: Number(newConsumption) || 0
      });
      setNewMatId('');
      setNewConsumption('');
      const res = await getEquipment();
      setItems(res.data);
      const item = res.data.find((i: EquipmentItem) => i.id === selectedEquipmentId);
      setSpecs(item?.specifications || []);
    } catch (e) { console.error(e); }
  };

  const handleRemoveSpec = async (specId: number) => {
    if (!selectedEquipmentId) return;
    try {
      await removeEquipmentSpecification(selectedEquipmentId, specId);
      const res = await getEquipment();
      setItems(res.data);
      const item = res.data.find((i: EquipmentItem) => i.id === selectedEquipmentId);
      setSpecs(item?.specifications || []);
    } catch (e) { console.error(e); }
  };

  const handleReplenish = async (specId: number) => {
    if (!selectedEquipmentId || !replenishAmount[specId]) return;
    try {
      await replenishEquipmentResource(selectedEquipmentId, specId, {
        resource_added: Number(replenishAmount[specId])
      });
      setReplenishAmount(prev => ({ ...prev, [specId]: '' }));
      const res = await getEquipment();
      setItems(res.data);
      const item = res.data.find((i: EquipmentItem) => i.id === selectedEquipmentId);
      setSpecs(item?.specifications || []);
    } catch (e) { console.error(e); }
  };

  const getProgressColor = (current: number, min: number) => {
    if (current <= min) return 'red';
    if (current <= min * 2) return 'orange';
    return 'green';
  };

  // Конфигурация колонок для SortableTable
  const columns: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px', filterType: 'text' },
    { key: 'name', label: 'Название', filterType: 'text' },
    { key: 'cost', label: 'Стоимость', filterType: 'text', render: (val: number) => `${val} ₽` },
    { key: 'spec_summary', label: 'Расходники', filterable: false, render: (_: any, row: EquipmentItem) => (
      row.specifications.length > 0 ? (
        <Flex direction="column" gap={1}>
          {row.specifications.map(s => (
            <Flex key={s.id} align="center" gap={2}>
              <Text fontSize="xs">{s.material_name}</Text>
              <Badge
                colorScheme={getProgressColor(s.current_resource, s.min_resource)}
                fontSize="xs"
              >
                {s.current_resource}/{s.total_resource} {s.resource_type === 'percent' ? '%' : s.resource_type}
              </Badge>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Text color="gray.400" fontSize="sm">Нет</Text>
      )
    )},
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: EquipmentItem) => (
      <Flex gap={1}>
        <IconButton aria-label="Spec" icon={<FiRefreshCw />} size="sm" variant="ghost" colorScheme="green" onClick={() => openSpecModal(row.id, row.name)} title="Спецификация" />
        <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} />
        <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} />
      </Flex>
    )},
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">Оборудование</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить</Button>
      </Flex>

      <Card><CardBody overflowX="auto">
        <SortableTable columns={columns} data={items.map(i => ({ ...i, spec_summary: '' }))} size="md" />
      </CardBody></Card>

      {/* Модальное окно оборудования */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Редактировать' : 'Добавить оборудование'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Box>
                <FormLabel>Название</FormLabel>
                <ChakraInput placeholder="Введите название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Box>
              <Box>
                <FormLabel>Стоимость (₽)</FormLabel>
                <ChakraInput type="number" placeholder="Введите стоимость" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
              </Box>
              <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Модальное окно спецификации */}
      <Modal isOpen={showSpecModal} onClose={() => setShowSpecModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Спецификация: {selectedEquipmentName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              {/* Добавление расходника */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Text fontWeight="bold" mb={3}>Добавить расходник</Text>
                <Flex direction={{ base: 'column', md: 'row' }} gap={2} mb={2}>
                  <ChakraSelect placeholder="Выберите материал" value={newMatId} onChange={e => setNewMatId(e.target.value)} flex={2}>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit_name})</option>)}
                  </ChakraSelect>
                  <ChakraSelect value={newResourceType} onChange={e => setNewResourceType(e.target.value)} flex={1}>
                    <option value="percent">Проценты</option>
                    <option value="pieces">Штуки</option>
                    <option value="hours">Часы</option>
                  </ChakraSelect>
                </Flex>
                <Flex direction={{ base: 'column', md: 'row' }} gap={2} mb={2}>
                  <ChakraInput type="number" placeholder="Максимум" value={newTotalResource} onChange={e => setNewTotalResource(e.target.value)} flex={1} />
                  <ChakraInput type="number" placeholder="Текущий" value={newCurrentResource} onChange={e => setNewCurrentResource(e.target.value)} flex={1} />
                  <ChakraInput type="number" placeholder="Минимум" value={newMinResource} onChange={e => setNewMinResource(e.target.value)} flex={1} />
                </Flex>
                <ChakraInput type="number" placeholder="Расход на единицу продукта" value={newConsumption} onChange={e => setNewConsumption(e.target.value)} mb={2} />
                <Button colorScheme="green" onClick={handleAddSpec} isDisabled={!newMatId}>Добавить</Button>
              </Box>

              {/* Список расходников */}
              {specs.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={3}>Текущие расходники</Text>
                  {specs.map(s => {
                    const percentage = (s.current_resource / s.total_resource) * 100;
                    const isLow = s.current_resource <= s.min_resource;
                    return (
                      <Box key={s.id} border="1px solid" borderColor={isLow ? 'red.300' : 'gray.200'} borderRadius="md" p={3} mb={2}>
                        {isLow && (
                          <Alert status="warning" mb={2} borderRadius="md" py={1}>
                            <AlertIcon boxSize={4} />
                            <Text fontSize="sm">Низкий остаток! Нужно пополнить.</Text>
                          </Alert>
                        )}
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontWeight="semibold">{s.material_name}</Text>
                          <IconButton aria-label="Remove" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleRemoveSpec(s.id)} />
                        </Flex>
                        <Flex align="center" gap={2} mb={2}>
                          <Progress
                            value={percentage}
                            colorScheme={getProgressColor(s.current_resource, s.min_resource)}
                            size="sm"
                            flex={1}
                            borderRadius="md"
                          />
                          <Text fontSize="sm" fontWeight="bold">
                            {s.current_resource}/{s.total_resource} {s.resource_type === 'percent' ? '%' : s.resource_type}
                          </Text>
                        </Flex>
                        <Flex gap={2}>
                          <ChakraInput
                            type="number"
                            placeholder="Пополнить на..."
                            value={replenishAmount[s.id] || ''}
                            onChange={e => setReplenishAmount(prev => ({ ...prev, [s.id]: e.target.value }))}
                            size="sm"
                            flex={1}
                          />
                          <Button
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleReplenish(s.id)}
                            isDisabled={!replenishAmount[s.id]}
                          >
                            Пополнить
                          </Button>
                        </Flex>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Equipment;
