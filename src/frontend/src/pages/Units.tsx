import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, useDisclosure, FormLabel
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getUnits, createUnit, updateUnit, deleteUnit } from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Unit { id: number; name: string; }

function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ name: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { setUnits((await getUnits()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpen = (u?: Unit) => {
    if (u) { setEditing(u); setForm({ name: u.name }); }
    else { setEditing(null); setForm({ name: '' }); }
    onOpen();
  };

  const handleClose = () => { onClose(); setEditing(null); };

  const handleSubmit = async () => {
    try {
      if (editing) await updateUnit(editing.id, form);
      else await createUnit(form);
      fetchData(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить единицу измерения?')) { await deleteUnit(id); fetchData(); }
  };

  const columns: ColumnConfig[] = [
    { key: 'id', label: 'ID', width: '60px', filterType: 'text' },
    { key: 'name', label: 'Название', filterType: 'text' },
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: Unit) => (
      <Flex gap={1}>
        <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(row)} />
        <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(row.id)} />
      </Flex>
    )},
  ];

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Единицы измерения</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить</Button>
      </Flex>
      <Card><CardBody>
        <SortableTable columns={columns} data={units} />
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay /><ModalContent>
          <ModalHeader>{editing ? 'Редактировать' : 'Добавить единицу измерения'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Box>
                <FormLabel>Название</FormLabel>
                <ChakraInput placeholder="Например: Штуки, Килограммы..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Box>
              <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Units;