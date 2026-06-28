import { useState, useEffect, useMemo } from 'react';
import {
  Box, Button, Text, Input as ChakraInput, Select as ChakraSelect,
  Card, CardBody, Flex, Spinner, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, IconButton, useDisclosure, FormLabel,
  VStack, HStack, Badge
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiFolder, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';

interface Category { id: number; name: string; parent_id: number | null; }

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function buildCategoryTree(
  categories: Category[], excludeId?: number | null
): { id: number; label: string }[] {
  const map = new Map<number, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];
  const result: { id: number; label: string }[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }
  for (const cat of categories) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(map.get(cat.id)!);
    } else {
      roots.push(map.get(cat.id)!);
    }
  }

  function walk(nodes: (Category & { children: Category[] })[], prefix: string) {
    for (const node of nodes) {
      if (node.id !== excludeId) {
        result.push({ id: node.id, label: prefix + node.name });
        if (node.children.length > 0) {
          walk(node.children as (Category & { children: Category[] })[], prefix + '→ ');
        }
      }
    }
  }

  walk(roots, '');
  return result;
}

function CategoryRowView({
  node, level, searchQuery, onEdit, onDelete
}: {
  node: CategoryNode;
  level: number;
  searchQuery: string;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  return (
    <>
      <Flex
        align="center"
        pl={level * 6}
        py={2.5}
        px={4}
        borderBottom="1px solid"
        borderColor="gray.100"
        _hover={{ bg: 'gray.50' }}
        role="group"
      >
        <Box w="30px" textAlign="center">
          {hasChildren ? (
            <IconButton
              aria-label={expanded ? 'Свернуть' : 'Развернуть'}
              icon={expanded ? <FiChevronDown /> : <FiChevronRight />}
              size="xs"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
            />
          ) : (
            <FiFolder size={16} style={{ opacity: 0.5 }} />
          )}
        </Box>
        <HStack flex={1} spacing={2}>
          {level > 0 && <Text color="gray.400" fontSize="sm">→</Text>}
          <Text fontWeight={level === 0 ? 'semibold' : 'normal'}>{node.name}</Text>
          {hasChildren && (
            <Badge colorScheme="gray" fontSize="xs" variant="subtle">
              {node.children.length}
            </Badge>
          )}
        </HStack>
        <HStack opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 0.15s">
          <IconButton aria-label="Edit" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => onEdit(node)} title="Редактировать" />
          <IconButton aria-label="Delete" icon={<FiTrash2 />} size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete(node.id)} title="Удалить" />
        </HStack>
      </Flex>
      {hasChildren && expanded && (
        <>
          {node.children.map(child => (
            <CategoryRowView
              key={child.id}
              node={child}
              level={level + 1}
              searchQuery={searchQuery}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </>
      )}
    </>
  );
}

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', parent_id: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { setCategories((await getCategories()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const tree = useMemo(() => buildTree(categories), [categories]);

  const handleOpen = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, parent_id: String(category.parent_id || '') });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', parent_id: '' });
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setEditingCategory(null);
    setFormData({ name: '', parent_id: '' });
  };

  const handleSubmit = async () => {
    try {
      const data = { name: formData.name, parent_id: formData.parent_id ? Number(formData.parent_id) : null };
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      fetchCategories(); handleClose();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Удалить категорию?')) { await deleteCategory(id); fetchCategories(); }
  };

  if (loading) return <Spinner size="xl" />;

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'stretch', md: 'center' }} mb={6} gap={4}>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">Категории материалов</Text>
        <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
          <Box position="relative" w={{ base: '100%', md: '250px' }}>
            <ChakraInput placeholder="Поиск по названию..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} pl={8} pr={8} />
            <Box position="absolute" left={2} top="50%" transform="translateY(-50%)" color="gray.400"><FiSearch /></Box>
            {searchQuery && (
              <Box
                position="absolute" right={2} top="50%" transform="translateY(-50%)"
                cursor="pointer" color="gray.400" _hover={{ color: 'gray.600' }}
                onClick={() => setSearchQuery('')} zIndex={1}
              >
                <FiX size={16} />
              </Box>
            )}
          </Box>
          <Button colorScheme="blue" leftIcon={<FiPlus />} onClick={() => handleOpen()} w={{ base: '100%', md: 'auto' }}>Добавить категорию</Button>
        </Flex>
      </Flex>
      <Card><CardBody overflowX="auto" p={0}>
        <VStack spacing={0} align="stretch">
          {tree.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>Нет категорий</Text>
          ) : (
            tree.map(node => (
              <CategoryRowView
                key={node.id}
                node={node}
                level={0}
                searchQuery={searchQuery}
                onEdit={handleOpen}
                onDelete={handleDelete}
              />
            ))
          )}
        </VStack>
      </CardBody></Card>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay /><ModalContent>
          <ModalHeader>{editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}</ModalHeader><ModalCloseButton />
          <ModalBody pb={6}><Box display="flex" flexDirection="column" gap={4}>
            <Box><FormLabel>Название</FormLabel><ChakraInput placeholder="Введите название" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></Box>
            <Box><FormLabel>Родительская категория</FormLabel>
              <ChakraSelect placeholder="Без родительской категории" value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })}>
                {buildCategoryTree(categories, editingCategory?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
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
