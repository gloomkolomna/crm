import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, useDisclosure, FormLabel
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api';
import SortableTable from '../components/SortableTable';
import type { ColumnConfig } from '../components/SortableTable';

interface Customer { id: number; name: string; type_id: number; contact_info: string | null; }

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({ name: '', type_id: '', contact_info: '' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { setCustomers((await getCustomers()).data); } catch (e) { console.error(e); } finally { setLoading(false); } };
  const handleOpen = (c?: Customer) => { setEditing(c || null); setForm(c ? { name: c.name, type_id: String(c.type_id), contact_info: c.contact_info || '' } : { name: '', type_id: '', contact_info: '' }); onOpen(); };
  const handleClose = () => { onClose(); setEditing(null); };
  const handleSubmit = async () => { try { if (editing) await updateCustomer(editing.id, { ...form, type_id: Number(form.type_id) }); else await createCustomer({ ...form, type_id: Number(form.type_id) }); fetchData(); handleClose(); } catch (e) { console.error(e); } };
  const handleDelete = async (id: number) => { if (confirm('Удалить?')) { await deleteCustomer(id); fetchData(); } };

  const columns: ColumnConfig[] = [
    { key: '_icon', label: '', width: '30px', sortable: false, filterable: false, render: () => <FiUser size={16} /> },
    { key: 'name', label: 'Название', filterType: 'text' },
    { key: 'type_id', label: 'Тип', filterType: 'select', render: (val: number) => val === 1 ? 'Физ. лицо' : 'Юр. лицо' },
    { key: 'contact_info', label: 'Контакты', filterType: 'text' },
    { key: '_actions', label: 'Действия', sortable: false, filterable: false, render: (_: any, row: Customer) => (
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
        <Text fontSize="2xl" fontWeight="bold">Клиенты</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить</Button>
      </Flex>
      <Card><CardBody>
        <SortableTable columns={columns} data={customers} />
      </CardBody></Card>
      <Modal isOpen={isOpen} onClose={handleClose}><ModalOverlay /><ModalContent>
        <ModalHeader>{editing ? 'Редактировать' : 'Добавить клиента'}</ModalHeader><ModalCloseButton />
        <ModalBody pb={6}><Box display="flex" flexDirection="column" gap={4}>
          <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Box>
          <Box><FormLabel>Тип (1 - физ, 2 - юр)</FormLabel><ChakraInput placeholder="Введите тип" value={form.type_id} onChange={e => setForm({ ...form, type_id: e.target.value })} /></Box>
          <Box><FormLabel>Контакты</FormLabel><ChakraInput placeholder="Введите контакты" value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })} /></Box>
          <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
        </Box></ModalBody>
      </ModalContent></Modal>
    </Box>
  );
}
export default Customers;