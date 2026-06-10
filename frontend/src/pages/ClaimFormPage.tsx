import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPlot } from '../api/client';
import type { PlotFormValues } from '../types';

export function ClaimFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PlotFormValues>({
    initialValues: {
      plot_number: '',
      claimer: '',
      crop: '',
      claim_date: null,
      expected_harvest_date: null,
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
              <TextInput
                label="作物"
                placeholder="例如 番茄"
                withAsterisk
                {...form.getInputProps('crop')}
              />
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
