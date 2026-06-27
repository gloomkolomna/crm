import {
  Box, Text, Card, CardBody, CardHeader, Grid, Flex, Table, Thead, Tbody, Tr, Th, Td,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Badge, Alert, AlertIcon, OrderedList, UnorderedList, ListItem, Code
} from '@chakra-ui/react';

function Guide() {
  return (
    <Box>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>Руководство пользователя</Text>
      <Text color="gray.500" mb={6}>Система учёта производства блокнотов и настольных игр</Text>

      <Accordion allowToggle defaultIndex={[0]}>

        {/* === 1. ОБЗОР СИСТЕМЫ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              📊 1. Обзор системы
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={6}>
              <Card>
                <CardHeader pb={2}><Text fontWeight="semibold">🎯 Назначение</Text></CardHeader>
                <CardBody pt={0}><Text>Автоматизация учёта производства блокнотов и настольных игр: от закупки материалов до отгрузки готовой продукции клиентам.</Text></CardBody>
              </Card>
              <Card>
                <CardHeader pb={2}><Text fontWeight="semibold">🔧 Возможности</Text></CardHeader>
                <CardBody pt={0}>
                  <UnorderedList spacing={1}>
                    <ListItem>Складской учёт материалов (приход, расход, остатки)</ListItem>
                    <ListItem>Спецификации продуктов (нормы расхода)</ListItem>
                    <ListItem>Учёт оборудования и расходников</ListItem>
                    <ListItem>Заказы клиентов, продажи, аналитика</ListItem>
                  </UnorderedList>
                </CardBody>
              </Card>
            </Grid>

            <Text fontWeight="semibold" mb={3}>🏗️ Общая схема работы</Text>
            <Flex wrap="wrap" gap={2} align="center" justify="center" bg="gray.50" p={4} borderRadius="lg">
              <Box bg="blue.500" color="white" p={3} borderRadius="md" fontWeight="bold" textAlign="center" minW="100px">📦<br/>Справочники</Box>
              <Text fontSize="xl" color="gray.400">→</Text>
              <Box bg="orange.400" color="white" p={3} borderRadius="md" fontWeight="bold" textAlign="center" minW="100px">🛒<br/>Продажи</Box>
              <Text fontSize="xl" color="gray.400">→</Text>
              <Box bg="red.500" color="white" p={3} borderRadius="md" fontWeight="bold" textAlign="center" minW="100px">📈<br/>Отчёты</Box>
            </Flex>
            <Text color="gray.500" fontSize="sm" textAlign="center" mt={2}>Сначала справочники → продажи → анализ в отчётах.</Text>
          </AccordionPanel>
        </AccordionItem>

        {/* === 2. НАЧАЛО РАБОТЫ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              🔑 2. Начало работы
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Text fontWeight="semibold" mb={2}>Вход в систему</Text>
            <OrderedList spacing={1} mb={4}>
              <ListItem>Откройте браузер и перейдите по адресу системы.</ListItem>
              <ListItem>Введите <b>логин</b> и <b>пароль</b>, выданные администратором.</ListItem>
              <ListItem>Нажмите <b>«Войти»</b>. Флажок «Запомнить меня» сохранит сессию.</ListItem>
              <ListItem>После входа откроется <b>Дашборд</b> — главный экран.</ListItem>
            </OrderedList>
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              По умолчанию: логин <Code>admin</Code>, пароль <Code>111</Code>. Смените пароль после первого входа.
            </Alert>

            <Text fontWeight="semibold" mb={2}>🧭 Навигация</Text>
            <Text mb={3}>Слева — боковое меню. На телефоне меню открывается по кнопке ☰ в заголовке.</Text>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={2}>
              {[
                ['📊', 'Дашборд', 'Ключевые показатели и графики'],
                ['📦', 'Материалы', 'Складской учёт сырья'],
                ['🏷️', 'Категории', 'Иерархия категорий'],
                ['📐', 'Ед. измерения', 'Справочник единиц'],
                ['📋', 'Продукты', 'Готовая продукция и спецификации'],
                ['🔧', 'Оборудование', 'Станки, оснастка, расходники'],
                ['👥', 'Клиенты', 'База заказчиков'],
                ['🛒', 'Продажи', 'Заказы и аналитика'],
                ['🚚', 'Доставка', 'Способы отгрузки'],
                ['📈', 'Отчёты', 'Аналитика склада'],
              ].map(([icon, label, desc], i) => (
                <Flex key={i} bg="white" border="1px" borderColor="gray.200" borderRadius="md" p={2} align="center" gap={3}>
                  <Text fontSize="xl">{icon}</Text>
                  <Box><Text fontWeight="semibold" fontSize="sm">{label}</Text><Text color="gray.500" fontSize="xs">{desc}</Text></Box>
                </Flex>
              ))}
            </Grid>
          </AccordionPanel>
        </AccordionItem>

        {/* === 3. ДАШБОРД === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              📊 3. Дашборд — главный экран
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Text mb={4}>Дашборд показывает сводку по бизнесу. Обновляется при каждом заходе.</Text>
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={3} mb={6}>
              {[['📦', 'Материалы', 'blue.600'], ['📋', 'Произведено', 'green.600'], ['👥', 'Клиенты', 'orange.500'], ['🛒', 'Заказы', 'red.500']].map(([icon, label, color], i) => (
                <Card key={i} textAlign="center">
                  <CardBody>
                    <Text fontSize="2xl">{icon}</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={color}>(кол-во)</Text>
                    <Text color="gray.500" fontSize="sm">{label}</Text>
                  </CardBody>
                </Card>
              ))}
            </Grid>
            <UnorderedList spacing={1}>
              <ListItem><b>📊 Остатки материалов</b> — столбчатая диаграмма: текущий остаток и минимальный запас (топ-10).</ListItem>
              <ListItem><b>📈 Продажи по датам</b> — линейный график выручки за последние 10 дней.</ListItem>
            </UnorderedList>
          </AccordionPanel>
        </AccordionItem>

        {/* === 4. СПРАВОЧНИКИ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              📚 4. Справочники
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Text mb={4}>Перед началом работы заполните справочники — это делается один раз.</Text>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">📐 Единицы измерения</Text>
              <OrderedList fontSize="sm" spacing={1} mt={1}>
                <ListItem>Раздел <b>«Ед. измерения»</b> → <b>«+ Добавить»</b>.</ListItem>
                <ListItem>Введите название (шт, кг, лист, рулон, м²...) → сохраните.</ListItem>
              </OrderedList>
              <Text fontSize="xs" color="gray.500" mt={1}>Уже есть 10 стандартных единиц.</Text>
            </CardBody></Card>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">🏷️ Категории</Text>
              <OrderedList fontSize="sm" spacing={1} mt={1}>
                <ListItem><b>«Категории»</b> → <b>«+ Добавить»</b> → название (Бумага, Краски, Клей...).</ListItem>
                <ListItem>Можно указать родительскую категорию для иерархии (Бумага → Офсетная).</ListItem>
              </OrderedList>
            </CardBody></Card>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">📦 Материалы</Text>
              <OrderedList fontSize="sm" spacing={1} mt={1}>
                <ListItem><b>«Материалы»</b> → <b>«+ Добавить»</b> → название, категория, единица, тип (сырьё/расходник), мин. остаток.</ListItem>
              </OrderedList>
              <Text fontWeight="semibold" fontSize="sm" mt={2}>Закупка (оприходование):</Text>
              <OrderedList fontSize="sm" spacing={1}>
                <ListItem>Нажмите на материал в таблице → <b>«+ Закупка»</b>.</ListItem>
                <ListItem>Укажите количество, цену, дату → сохраните. Остаток и средняя себестоимость обновятся автоматически.</ListItem>
              </OrderedList>
              <Text fontSize="xs" color="gray.500" mt={1}>Фильтры: по категории и типу (сырьё/расходник).</Text>
            </CardBody></Card>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">📋 Продукты</Text>
              <OrderedList fontSize="sm" spacing={1} mt={1}>
                <ListItem><b>«Продукты»</b> → <b>«+ Добавить»</b> → название, цена продажи.</ListItem>
                <ListItem>Нажмите продукт → вкладка <b>«Материалы»</b> → <b>«+»</b> → выберите материал и норму на 1 ед.</ListItem>
                <ListItem>Вкладка <b>«Оборудование»</b> → <b>«+»</b> → выберите оборудование и сумму амортизации на 1 ед.</ListItem>
              </OrderedList>
              <Text fontSize="xs" color="gray.500" mt={1}>Кнопка 🖨️ — печать чек-листа для цеха.</Text>
            </CardBody></Card>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">🔧 Оборудование</Text>
              <OrderedList fontSize="sm" spacing={1} mt={1}>
                <ListItem><b>«Оборудование»</b> → <b>«+»</b> → название станка.</ListItem>
                <ListItem>Вкладка <b>«Спецификация»</b> → добавить расходник, тип ресурса, общий ресурс, расход на ед.</ListItem>
                <ListItem>Кнопка <b>«Пополнить»</b> — увеличить ресурс (замена лезвия, заправка и т.д.).</ListItem>
              </OrderedList>
              <Text fontSize="xs" color="gray.500" mt={1}>Индикатор ресурса: 🟢 зелёный / 🟡 жёлтый / 🔴 красный.</Text>
            </CardBody></Card>

            <Card mb={3}><CardBody>
              <Text fontWeight="semibold">👥 Клиенты</Text>
              <Text fontSize="sm"><b>«Клиенты»</b> → <b>«+»</b> → имя или название организации.</Text>
            </CardBody></Card>

            <Card><CardBody>
              <Text fontWeight="semibold">🚚 Способы доставки</Text>
              <Text fontSize="sm"><b>«Способы доставки»</b> → <b>«+»</b> → название (СДЭК, Почта, самовывоз). Можно отключить флажком.</Text>
            </CardBody></Card>
          </AccordionPanel>
        </AccordionItem>

        {/* === 5. БИЗНЕС-ПРОЦЕССЫ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              🔄 5. Бизнес-процессы
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Text fontWeight="semibold" mb={3}>Полный цикл: от закупки до продажи</Text>
            <Flex wrap="wrap" gap={1} align="center" justify="center" mb={4}>
              {[
                ['1. Закупка', 'blue.500'],
                ['2. Спецификация', 'green.500'],
                ['3. Продажа', 'red.500'],
                ['4. Отчёт', 'purple.500'],
              ].map(([label, bg], i, arr) => (
                <Flex key={i} align="center" gap={1}>
                  <Box bg={bg} color="white" py={2} px={3} borderRadius="md" fontWeight="semibold" fontSize="sm" textAlign="center">{label}</Box>
                  {i < arr.length - 1 && <Text color="gray.400" fontSize="lg">→</Text>}
                </Flex>
              ))}
            </Flex>

            <Table variant="simple" size="sm">
              <Thead><Tr><Th>Шаг</Th><Th>Раздел</Th><Th>Что делать</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>1</Td><Td>Материалы</Td><Td>Создать → закупить партию</Td></Tr>
                <Tr><Td>2</Td><Td>Продукты</Td><Td>Создать → добавить спецификацию</Td></Tr>
                <Tr><Td>3</Td><Td>Продажи</Td><Td>Создать заказ → позиции → оплата/отправка</Td></Tr>
                <Tr><Td>4</Td><Td>Отчёты</Td><Td>Остатки, графики, низкие запасы</Td></Tr>
              </Tbody>
            </Table>
          </AccordionPanel>
        </AccordionItem>

        {/* === 6. ПРОДАЖИ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              🛒 6. Продажи
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <Text fontWeight="semibold" mb={2}>Создание заказа:</Text>
            <OrderedList spacing={1} mb={4}>
              <ListItem>Вкладка <b>«Заказы»</b> → <b>«Создать заказ»</b>.</ListItem>
              <ListItem>Заполните: клиент, дата, стоимость доставки, флажки.</ListItem>
              <ListItem>В правой части добавьте <b>позиции</b>: продукт → количество → цена (авто) → <b>+</b>.</ListItem>
              <ListItem>Нажмите <b>«Создать заказ»</b>.</ListItem>
            </OrderedList>

            <Text fontWeight="semibold" mb={2}>Управление статусами:</Text>
            <Table variant="simple" size="sm" mb={4}>
              <Thead><Tr><Th>Кнопка</Th><Th>Действие</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>✔ Оплатить</Td><Td>Пометить заказ оплаченным</Td></Tr>
                <Tr><Td>🚚 Отправить</Td><Td>Пометить отправленным + дата</Td></Tr>
                <Tr><Td>📦 Оплатить и отправить</Td><Td>Одним кликом: оплата + отправка + дата</Td></Tr>
                <Tr><Td>📋 Позиции</Td><Td>Просмотр и добавление позиций</Td></Tr>
                <Tr><Td>✏️ Редактировать</Td><Td>Изменить заказ (только до отправки)</Td></Tr>
                <Tr><Td>🗑️ Удалить</Td><Td>Удалить заказ (только до отправки)</Td></Tr>
              </Tbody>
            </Table>

            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              После отправки заказ <b>блокируется</b> — защита от случайных правок.
            </Alert>

            <Text fontWeight="semibold" mb={2}>📈 Аналитика продаж (вкладка):</Text>
            <UnorderedList spacing={1}>
              <ListItem>Общая выручка, расходы на доставку, оплаченных заказов</ListItem>
              <ListItem>Топ продуктов — по количеству и выручке</ListItem>
              <ListItem>Топ клиентов — по числу заказов и сумме</ListItem>
            </UnorderedList>
          </AccordionPanel>
        </AccordionItem>

        {/* === 8. ОТЧЁТЫ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              📈 7. Отчёты и аналитика
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <UnorderedList spacing={2} mb={4}>
              <ListItem><b>График расхода расходников</b> — выберите оборудование → линейный график за 30 дней.</ListItem>
              <ListItem><b>Остатки материалов</b> — столбчатая диаграмма (остаток + минимум) и круговая (распределение %).</ListItem>
            </UnorderedList>

            <Alert status="warning" mb={4} borderRadius="md" flexDirection="column" alignItems="flex-start">
              <Box><AlertIcon /><Text fontWeight="semibold" display="inline" ml={1}>Материалы с низким остатком!</Text></Box>
              <Text fontSize="sm" mt={1}>Если текущий остаток ниже минимального — появится жёлтый блок с таблицей таких позиций. Это сигнал к закупке.</Text>
            </Alert>

            <Text fontWeight="semibold" mb={2}>Полная таблица остатков:</Text>
            <Table variant="simple" size="sm">
              <Thead><Tr><Th>ID</Th><Th>Название</Th><Th>Остаток</Th><Th>Минимум</Th><Th>Ед.</Th><Th>Статус</Th></Tr></Thead>
              <Tbody>
                <Tr><Td>1</Td><Td>Пример</Td><Td>150</Td><Td>50</Td><Td>лист</Td><Td><Badge colorScheme="green">В норме</Badge></Td></Tr>
              </Tbody>
            </Table>
          </AccordionPanel>
        </AccordionItem>

        {/* === 9. FAQ === */}
        <AccordionItem>
          <AccordionButton py={3}>
            <Box as="span" flex="1" textAlign="left" fontWeight="semibold" fontSize="lg">
              ❓ 8. Часто задаваемые вопросы
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            {[
              ['Как добавить материал, если нет нужной единицы измерения?',
                'Сначала зайдите в <b>«Ед. измерения»</b>, добавьте нужную единицу (например, «рулон»). Затем возвращайтесь в «Материалы» — новая единица появится в списке.'],
              ['Почему не получается добавить товар в заказ?',
                'Проверьте: (1) достаточно ли материалов на складе — смотрите в <b>«Отчёты» → остатки</b>; (2) достаточно ли ресурса оборудования — смотрите индикатор в <b>«Оборудование»</b>.'],
              ['Как посмотреть состав продукта?',
                'Нажмите на продукт в разделе <b>«Продукты»</b> — откроются вкладки «Материалы» и «Оборудование». Кнопка 🖨️ — для печати чек-листа.'],
              ['Заказ уже отправили, но нужно изменить — как?',
                'Отправленный заказ <b>заблокирован</b>. Обратитесь к администратору для прямого редактирования. При удалении заказа или позиции материалы автоматически возвращаются на склад.'],
              ['Как узнать, какие материалы пора закупать?',
                'Откройте <b>«Отчёты»</b> — жёлтый блок «Материалы с низким остатком!» покажет все позиции ниже минимума.'],
              ['Можно ли работать с планшета или телефона?',
                'Да. Интерфейс полностью адаптивен: меню сворачивается в «гамбургер» (☰), таблицы и формы перестраиваются под узкий экран.'],
              ['Где взять первоначальные остатки?',
                'Создайте материал в справочнике, нажмите на него и добавьте <b>первую закупочную партию</b> с нужным количеством и ценой — это и будет начальный остаток.'],
            ].map(([q, a], i) => (
              <Box key={i} mb={4}>
                <Text fontWeight="semibold" mb={1}>{i + 1}. {q}</Text>
                <Text color="gray.600" dangerouslySetInnerHTML={{ __html: a }} />
              </Box>
            ))}
          </AccordionPanel>
        </AccordionItem>

      </Accordion>
    </Box>
  );
}

export default Guide;
