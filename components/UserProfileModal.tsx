import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { KeyIcon, EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAlertContext } from '@/lib/contexts/AlertContext'
import SuccessModal from './SuccessModal'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, refreshUser } = useAuth()
  const { showSuccess, showError } = useAlertContext()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (newPassword !== confirmPassword) {
      showError('As novas senhas não coincidem.')
      return
    }

    if (newPassword.length < 6) {
      showError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        await refreshUser()
        onClose()
        setShowSuccessModal(true)
      } else {
        showError(data?.message || 'Não foi possível atualizar a senha.')
      }
    } catch (error) {
      showError('Erro ao comunicar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-secondary-900 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-secondary-900 dark:text-secondary-100 flex items-center gap-2"
                >
                  <UserCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  Perfil do Usuário
                </Dialog.Title>

                <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                  Visualize seus dados e atualize a senha para manter sua conta segura.
                </p>

                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
                    <div>
                      <span className="text-xs font-semibold uppercase text-secondary-500 dark:text-secondary-400">
                        Nome
                      </span>
                      <p className="mt-1 text-sm text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                        <UserCircleIcon className="h-5 w-5 text-primary-500" />
                        {user?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase text-secondary-500 dark:text-secondary-400">
                        Email
                      </span>
                      <p className="mt-1 text-sm text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                        <EnvelopeIcon className="h-5 w-5 text-primary-500" />
                        {user?.email || '-'}
                      </p>
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-200">
                        Senha atual
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                        </div>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 py-2 pl-10 pr-3 text-sm text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Digite sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-200">
                        Nova senha
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                        </div>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 py-2 pl-10 pr-3 text-sm text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Digite a nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-200">
                        Confirmar nova senha
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                        </div>
                        <input
                          type="password"
                          className="block w-full rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 py-2 pl-10 pr-3 text-sm text-secondary-900 dark:text-secondary-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Confirme a nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Salvando...' : 'Atualizar Senha'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>

    {/* Modal de Sucesso */}
    <SuccessModal
      open={showSuccessModal}
      title="Sucesso!"
      message="Senha atualizada com sucesso!"
      autoCloseDelay={4000}
      onClose={() => setShowSuccessModal(false)}
      onAutoClose={() => setShowSuccessModal(false)}
    />
  </>
  )
}

