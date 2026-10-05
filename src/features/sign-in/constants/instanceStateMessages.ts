import type { StateInstanceResponse } from '@app/api/types';

export const INSTANCE_STATE_MESSAGES: Record<StateInstanceResponse['stateInstance'], string> = {
  authorized: '',
  starting: 'Инстанс запускается. Попробуйте через минуту.',
  sleepMode: 'Инстанс в спящем режиме. Откройте приложение MAX на телефоне.',
  blocked: 'Инстанс заблокирован. Проверьте тариф в личном кабинете GREEN-API.',
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API и повторите вход.',
};
