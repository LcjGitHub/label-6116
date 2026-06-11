import {
  Button,
  Combobox,
  Container,
  Group,
  InputBase,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  useCombobox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPlot, fetchCrops } from '../api/client';
import type { Crop, PlotFormValues } from '../types';

export function ClaimFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [cropOptions, setCropOptions] = useState<string[]>([]);
  const [cropLoadError, setCropLoadError] = useState<string | null>(null);
  const [cropSearch, setCropSearch] = useState('');
  const combobox = useCombobox();

  useEffect(() => {
    let active = true;
    fetchCrops()
      .then((crops: Crop[]) => {
        if (active) {
          setCropOptions(crops.map((c) => c.name));
          setCropLoadError(null);
        }
      })
      .catch(() => {
        if (active) {
          setCropLoadError('加载作物列表失败，请确认后端服务已启动');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCrops = cropOptions.filter((name) =>
    name.toLowerCase().includes(cropSearch.toLowerCase()),
  );

  const exactMatch = cropOptions.some(
    (name) => name.toLowerCase() === cropSearch.toLowerCase(),
  );

  const cropOptionsRender = filteredCrops.map((name) => (
    <Combobox.Option key={name} value={name}>
      {name}
    </Combobox.Option>
  ));

  const form = useForm<PlotFormValues>({
    initialValues: {
      plot_number: '',
      claimer: '',
      crop: '',
      claim_date: null,
      expected_harvest_date: null,
      status: '种植中',
    },
    validate: {
      plot_number: (value) => (value.trim() ? null : '请输入地块编号'),
      claimer: (value) => (value.trim() ? null : '请输入认领人'),
      crop: (value) => (value.trim() ? null : '请输入作物'),
      claim_date: (value) => (value ? null : '请选择认领日期'),
      expected_harvest_date: (value, values) => {
        if (!value) {
          return '请选择预计收获日';
        }
        if (values.claim_date && value < values.claim_date) {
          return '预计收获日不能早于认领日期';
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: PlotFormValues) => {
    setSubmitting(true);
    try {
      await createPlot({
        plot_number: values.plot_number.trim(),
        claimer: values.claimer.trim(),
        crop: values.crop.trim(),
        claim_date: dayjs(values.claim_date).format('YYYY-MM-DD'),
        expected_harvest_date: dayjs(values.expected_harvest_date).format('YYYY-MM-DD'),
        status: values.status,
      });
      notifications.show({
        title: '登记成功',
        message: '地块认领信息已保存',
        color: 'green',
      });
      navigate('/');
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String(err.response.data.error)
          : '提交失败，请稍后重试';
      notifications.show({
        title: '登记失败',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            to="/"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
          >
            返回列表
          </Button>
        </Group>

        <Title order={2}>认领登记</Title>
        <Text c="dimmed" size="sm">
          填写地块认领信息并提交保存
        </Text>

        {cropLoadError && (
          <Text c="red" size="sm">
            {cropLoadError}
          </Text>
        )}

        <Paper withBorder p="lg" radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="地块编号"
                placeholder="例如 A-03"
                withAsterisk
                {...form.getInputProps('plot_number')}
              />
              <TextInput
                label="认领人"
                placeholder="请输入认领人姓名"
                withAsterisk
                {...form.getInputProps('claimer')}
              />
              <Combobox
                store={combobox}
                onOptionSubmit={(value) => {
                  form.setFieldValue('crop', value);
                  setCropSearch(value);
                  combobox.closeDropdown();
                }}
              >
                <Combobox.Target>
                  <InputBase
                    label="作物"
                    placeholder="选择或输入作物名称"
                    withAsterisk
                    rightSection={<Combobox.Chevron />}
                    value={cropSearch}
                    onChange={(event) => {
                      setCropSearch(event.currentTarget.value);
                      form.setFieldValue('crop', event.currentTarget.value);
                      combobox.openDropdown();
                      combobox.updateSelectedOptionIndex();
                    }}
                    onFocus={() => {
                      combobox.openDropdown();
                    }}
                    onBlur={() => {
                      combobox.closeDropdown();
                    }}
                    error={form.errors.crop}
                  />
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {cropOptionsRender}
                    {!exactMatch && cropSearch.trim() && (
                      <Combobox.Option value={cropSearch}>
                        新增自定义作物 "{cropSearch}"
                      </Combobox.Option>
                    )}
                    {filteredCrops.length === 0 && !cropSearch.trim() && (
                      <Combobox.Empty>暂无作物数据</Combobox.Empty>
                    )}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>

              <DateInput
                label="认领日期"
                placeholder="选择认领日期"
                valueFormat="YYYY-MM-DD"
                withAsterisk
                {...form.getInputProps('claim_date')}
              />
              <DateInput
                label="预计收获日"
                placeholder="选择预计收获日"
                valueFormat="YYYY-MM-DD"
                withAsterisk
                {...form.getInputProps('expected_harvest_date')}
              />
              <Group justify="flex-end" mt="md">
                <Button type="submit" loading={submitting}>
                  提交登记
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
