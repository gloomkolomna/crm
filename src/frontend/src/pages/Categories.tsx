import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect, Table, Thead, Tbody, Tr, Th, Td,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, useDisclosure, FormLabel
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getCategories, createCategory, deleteCategory } from '../api';

interface Category { id: number; name: string; parent_id: number | null; }

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({ name: '', parent_id: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { setCategories((await getCategories()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpen = (category?: Category) => {
    if (category) { setFormData({ name: category.name, parent_id: String(category.parent_id || '') }); }
    else { setFormData({ name: '', parent_id: '' }); }
    onOpen();
  };

  const handleClose = () => { onClose(); setFormData({ name: '', parent_id: '' }); };

  const handleSubmit = async () => {
    try {
      const data = { name: formData.name, parent_id: formData.parent_id ? Number(formData.parent_id) : null };
      await createCategory(data); fetchCategories(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить категорию?')) { await deleteCategory(id); fetchCategories(); }
  };

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Категории материалов</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить категорию</Button>
      </Flex>
      <Card><CardBody>
        <Table variant="simple">
          <Thead><Tr><Th>ID</Th><Th>Название</Th><Th>Родительская категория</Th><Th>Действия</Th></Tr></Thead>
          <Tbody>{categories.map(c => (
            <Tr key={c.id}>
              <Td>{c.id}</Td><Td>{c.name}</Td>
              <Td>{categories.find(p => p.id === c.parent_id)?.name || '-'}</Td>
              <Td>
                <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(c)} />
                <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" ml={2} onClick={() => handleDelete(c.id)} />
              </Td>
            </Tr>
          ))}</Tbody>
        </Table>
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay /><ModalContent>
          <ModalHeader>Добавить категорию</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}><Box display="flex" flexDirection="column" gap={4}>
            <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Box>
            <Box><FormLabel>Родительская категория</FormLabel>
              <ChakraSelect placeholder="Без родительской категории" value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </ChakraSelect>
            </Box>
            <Button colorScheme="blue" onClick={handleSubmit}>Сохранить</Button>
          </Box></ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
export default Categories;