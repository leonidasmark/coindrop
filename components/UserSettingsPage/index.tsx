/* eslint-disable arrow-body-style */
import { FunctionComponent, useState } from 'react';
import {
    Box,
    Center,
    Flex,
    Button,
    Heading,
    Text,
    Input,
    FormControl,
    FormLabel,
    Checkbox,
    Spinner,
    useToast,
} from "@chakra-ui/react";
import useSWR from 'swr';
import { useForm } from "react-hook-form";
import { useUser } from '../../utils/auth/useUser';
import { withDefaultLayout } from '../Layout/DefaultLayoutHOC';
import { getUserData } from '../../src/db/queries/user/get-user-data';
import { EmailListIds, UserData } from '../../src/db/schema/user';
import { updateUserData } from '../../src/db/mutations/user/update-user';
import DeleteAccount from './DeleteAccount';


const optionalEmailLists: Record<EmailListIds, string> = {
    newsletter: "Coindrop Newsletter",
    // analytics: "Coindrop Analytics",
};
const alwaysEnabledEmailLists = [
    "Privacy Policy Updates",
    "Terms of Service Updates",
];

const SectionHeading: FunctionComponent = ({ children }) => (
    <Box mt={6} mb={3}>
        <Heading as="h2" size="md" mb={2}>
            {children}
        </Heading>
        <hr />
    </Box>
);

const UserSettings: FunctionComponent = () => {
    const { user } = useUser();
    const toast = useToast();
    const userId = user?.id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, error, mutate } = useSWR(
        userId ? 'user-data' : null,
        () => getUserData(userId),
    );
    const userData: UserData = data;
    const email = userData?.email;
    const email_lists = userData?.email_lists;
    const { register, handleSubmit, watch, errors, formState: { isDirty }, reset } = useForm();
    console.log('isDirty', isDirty);
    console.log('fetched data', userData);
    const onSubmit = async (rawFormData) => {
        setIsSubmitting(true);
        const userDataForDb = {
            email_lists: [],
        };
        Object.keys(optionalEmailLists).forEach(emailListId => {
            if (rawFormData[`email_list:${emailListId}`]) {
                userDataForDb.email_lists.push(emailListId);
            }
        });
        console.log('userDataForDb', userDataForDb);
        try {
            await updateUserData({ data: userDataForDb, userId });
            mutate(userDataForDb);
            reset(userDataForDb);
            toast({
                title: "Account updated.",
                // description: "We've created your account for you.",
                status: "success",
                duration: 6000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: "Error updating account.",
                description: "Please try again or contact support.",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <Heading as="h1" textAlign="center" my={4}>
                Account Settings
            </Heading>
            {!userData ? (
                <Center>
                    <Spinner />
                </Center>
            ) : (
                <>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <SectionHeading>
                        E-mail
                    </SectionHeading>
                    <Box
                        id="email-preferences-content"
                        m={4}
                    >
                        <FormControl id="email" isDisabled isReadOnly>
                            <FormLabel>Email address</FormLabel>
                            <Input type="email" name="email" defaultValue={email} />
                        </FormControl>
                        <FormLabel>Newsletters</FormLabel>
                        <Flex wrap="wrap">
                            {Object.entries(optionalEmailLists).map(([emailListId, emailListDisplayName]: [EmailListIds, string]) => {
                                return (
                                    <Checkbox
                                        key={emailListId}
                                        mr={6}
                                        name={`email_list:${emailListId}`}
                                        colorScheme="orange"
                                        defaultChecked={email_lists?.includes(emailListId)}
                                        ref={register()}
                                    >
                                        {emailListDisplayName}
                                    </Checkbox>
                                );
                            })}
                            {alwaysEnabledEmailLists.map(listName => (
                                <Checkbox
                                    key={listName}
                                    mr={6}
                                    colorScheme="orange"
                                    defaultChecked
                                    isDisabled
                                >
                                    {listName}
                                </Checkbox>
                            ))}
                        </Flex>
                    </Box>
                    <Box align="center">
                        <Button
                            colorScheme="green"
                            type="submit"
                            isDisabled={!isDirty || isSubmitting}
                            leftIcon={isSubmitting ? <Spinner size="sm" /> : undefined}
                        >
                            {isSubmitting ? 'Saving' : 'Save'}
                        </Button>
                    </Box>
                </form>
                <SectionHeading>
                    Danger Zone
                </SectionHeading>
                <DeleteAccount />
                </>
            )}
        </Box>
    );
};

export default withDefaultLayout(UserSettings);
