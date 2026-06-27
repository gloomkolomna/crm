import { useState, useEffect } from 'react';
import {
  Box, Button, Text, Input as ChakraInput,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton,
  useDisclosure, FormLabel, Table, Thead, Tbody, Tr, Th, Td, Badge
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import {
  getShippingMethods, createShippingMethod, updateShippingMethod, deleteShippingMethod
} from '../api';

interface ShippingMethod {
  id: number;
  name: string;
  is_active: boolean;
}

function ShippingMethods() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [editing, setEditing] = useState<ShippingMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await getShippingMethods();
      setMethods(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleOpen = (method?: ShippingMethod) => {
    if (method) {
      setEditing(method);
      setFormName(method.name);
      setFormActive(method.is_active);
    } else {
      setEditing(null);
      setFormName('');
      setFormActive(true);
    }
    onOpen();
  };

  const handleClose = () => { onClose(); setEditing(null); };

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (editing) {
        await updateShippingMethod(editing.id, { name: formName.trim(), is_active: formActive });
      } else {
        await createShippingMethod({ name: formName.trim(), is_active: formActive });
      }
      fetchData();
      handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить способ доставки?')) {
      try { await deleteShippingMethod(id); fetchData(); }
      catch (e) { console.error(e); }
    }
  };

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Способы доставки</Text>
        <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()}>Добавить</Button>
      </Flex>

      <Card>
        <CardBody>
          {methods.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Название</Th>
                  <Th>Статус</Th>
                  <Th>Действия</Th>
                </Tr>
              </Thead>
              <Tbody>
                {methods.map(m => (
                  <Tr key={m.id}>
                    <Td>{m.id}</Td>
                    <Td>{m.name}</Td>
                    <Td>
                      <Badge colorScheme={m.is_active ? 'green' : 'gray'}>
                        {m.is_active ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={1}>
                        <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => handleOpen(m)} />
                        <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(m.id)} />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text color="gray.500">Нет способов доставки</Text>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Редактировать способ доставки' : 'Добавить способ доставки'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box display="flex" flexDirection="column" gap={4}>
              <Box>
                <FormLabel>Название</FormLabel>
                <ChakraInput
                  placeholder="Например: СДЭК, Почта России, Курьером"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>Статус</FormLabel>
                <Button
                  colorScheme={formActive ? 'green' : 'gray'}
                  variant={formActive ? 'solid' : 'outline'}
                  onClick={() => setFormActive(!formActive)}
                >
                  {formActive ? 'Активен' : 'Неактивен'}
                </Button>
              </Box>
              <Button colorScheme="blue" onClick={handleSubmit} isDisabled={!formName.trim()}>
                Сохранить
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ShippingMethods;