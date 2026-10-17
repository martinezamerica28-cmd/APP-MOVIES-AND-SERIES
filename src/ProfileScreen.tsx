import React, { useState } from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { User } from 'firebase/auth';
import { Library } from './storage';
import { Title } from './catalog';
import { styles as s } from './theme';

type Props = {
 library: Library; ready: boolean; user: User | null;
 onChange: React.Dispatch<React.SetStateAction<Library>>;
 renderCard: (title: Title) => React.ReactNode;
 onSelect: (title: Title) => void; onAccount: () => void;
 onLogout: () => void; onDeleteAccount: () => void;
};
type Collection = { kind: 'favorites' | 'watching' | 'watched' | 'watchlist' | 'rated' | 'list'; name: string };
export function ProfileScreen({ library, ready, user, onChange, renderCard, onSelect, onAccount, onLogout, onDeleteAccount }: Props) {
 const [collection, setCollection] = useState<Collection>();
 const [newList, setNewList] = useState(''), [listError, setListError] = useState('');
 const [editing, setEditing] = useState(false), [name, setName] = useState(''), [bio, setBio] = useState(''), [photo, setPhoto] = useState<string>();
 const [photoBusy, setPhotoBusy] = useState(false), [photoError, setPhotoError] = useState('');
 const [confirmDelete, setConfirmDelete] = useState(false);
 const displayName = library.profile?.name || user?.displayName || 'Tu nombre';
 const photoUri = library.profile?.photoUri || user?.photoURL;
 const date = user?.metadata.creationTime || library.profile?.joinedAt;
 const joined = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : undefined;
 const entries = Object.values(library.entries);
 function items(c: Collection) { return entries.filter(e => c.kind === 'favorites' ? e.favorite : c.kind === 'watching' ? e.status === 'Viendo' : c.kind === 'watched' ? e.status === 'Vista' : c.kind === 'watchlist' ? e.status === 'Por ver' : c.kind === 'rated' ? !!e.rating : e.lists?.includes(c.name)).map(e => e.title); }
 function shelf(title: string, kind: Collection['kind'], emptyText: string) {
  const c = { name: title, kind }, titles = items(c);
  return <View style={s.section}><View style={s.sectionHeading}><Text style={[s.sectionTitle, { flex: 1 }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Ver todos: ${title}`} onPress={() => setCollection(c)} style={s.shelfArrow}><Text style={s.shelfArrowText}>{titles.length}  →</Text></Pressable></View>{titles.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{titles.map(renderCard)}</ScrollView> : <Text style={s.shelfEmpty}>{emptyText}</Text>}</View>;
 }
 async function pickPhoto() {
  setPhotoError(''); setPhotoBusy(true);
  try {
   const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
   if (result.canceled) return;
   const image = await manipulateAsync(result.assets[0].uri, [{ resize: { width: 256 } }], { compress: 0.7, format: SaveFormat.JPEG, base64: true });
   if (!image.base64 || image.base64.length > 180000) throw new Error('Elige una foto más pequeña.');
   setPhoto(`data:image/jpeg;base64,${image.base64}`);
  } catch { setPhotoError('No se pudo abrir la foto. Prueba con otra imagen o revisa el permiso de fotos.'); }
  finally { setPhotoBusy(false); }
 }
 if (collection) {
  const titles = items(collection);
  return <><Pressable accessibilityRole="button" onPress={() => { setCollection(undefined); setConfirmDelete(false); }} style={s.backLink}><Text style={s.buttonText}>‹ Volver a mi perfil</Text></Pressable><Text style={s.heading}>{collection.name}</Text><Text style={[s.muted, { marginVertical: 12 }]}>{titles.length} {titles.length === 1 ? 'título' : 'títulos'}</Text><View style={s.grid}>{titles.map(renderCard)}</View>{!titles.length && <View style={s.emptyCard}><Text style={s.emptyIcon}>▤</Text><Text style={s.muted}>Todavía no hay títulos aquí. Agrégalos desde el detalle de una película o serie.</Text></View>}{collection.kind === 'list' && <View style={{ marginTop: 24 }}>{!confirmDelete ? <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={s.button}><Text style={s.buttonText}>Eliminar lista</Text></Pressable> : <View style={s.review}><Text style={s.text}>¿Eliminar “{collection.name}”? Tus títulos, reseñas y favoritos se conservarán.</Text><Pressable accessibilityRole="button" disabled={!ready} onPress={() => { onChange(old => ({ ...old, lists: old.lists.filter(x => x !== collection.name), entries: Object.fromEntries(Object.entries(old.entries).map(([key, e]) => [key, { ...e, lists: e.lists?.filter(x => x !== collection.name) }])) })); setCollection(undefined); setConfirmDelete(false); }} style={[s.button, s.active]}><Text style={s.activeText}>Sí, eliminar lista</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setConfirmDelete(false)} style={s.button}><Text style={s.buttonText}>Cancelar</Text></Pressable></View>}</View>}</>;
 }
 return <>
  <View style={s.profileIdentity}>
   <View style={s.profilePhotoFrame}>{photoUri ? <Image source={{ uri: photoUri }} style={s.profilePhoto} /> : <LinearAvatar initial={displayName === 'Tu nombre' ? 'Y' : displayName[0].toUpperCase()} />}</View>
   <View style={s.profileDetails}><Text style={s.profileName}>{displayName}</Text><Text style={s.profileBio}>{library.profile?.bio || 'Este es tu rincón de películas y series.'}</Text>{joined && <Text style={s.joinedDate}>{user ? 'Se unió en' : 'En este dispositivo desde'} {joined}</Text>}<Pressable accessibilityRole="button" disabled={!ready} onPress={() => { setName(library.profile?.name || user?.displayName || ''); setBio(library.profile?.bio || ''); setPhoto(library.profile?.photoUri); setPhotoError(''); setEditing(true); }} style={s.editProfileButton}><Text style={s.editProfileText}>Editar perfil</Text></Pressable></View>
  </View>
  {shelf(displayName === 'Tu nombre' ? 'Mis favoritos' : `Favoritos de ${displayName}`, 'favorites', 'Las historias que más te gustan aparecerán aquí. Toca el corazón en un título.')}
  {shelf('Viendo actualmente', 'watching', '¿Empezaste una historia? Márcala como “Viendo” para continuar aquí.')}
  {shelf('Vistos', 'watched', 'Las películas y series que marques como “Vista” se guardarán aquí.')}
  <View style={s.sectionHeading}><Text style={s.sectionTitle}>Mis listas</Text><Text style={s.sectionCount}>{library.lists.length} listas</Text></View>
  <View style={s.listGroup}>{library.lists.map(list => { const count = items({ kind: 'list', name: list }).length; return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir lista: ${list}`} key={list} onPress={() => setCollection({ kind: 'list', name: list })} style={s.listLink}><View style={s.listSymbol}><Text style={s.listSymbolText}>▤</Text></View><View style={{ flex: 1 }}><Text style={s.listName}>{list}</Text><Text style={s.muted}>{count} {count === 1 ? 'título' : 'títulos'}</Text></View><Text style={s.listChevron}>›</Text></Pressable>; })}{!library.lists.length && <Text style={s.shelfEmpty}>Crea tus propias listas y ponles el nombre que quieras.</Text>}</View>
  <View style={[s.inline, { marginTop: 12 }]}><TextInput accessibilityLabel="Nombre de la nueva lista" style={[s.input, { flex: 1, minWidth: 0 }]} placeholder="Nombre de la nueva lista" placeholderTextColor="#8e92a5" value={newList} onChangeText={value => { setNewList(value); setListError(''); }} maxLength={60} /><Pressable accessibilityRole="button" disabled={!ready} onPress={() => { const value = newList.trim(); if (!value) { setListError('Escribe un nombre para tu lista.'); return; } if (library.lists.some(x => x.toLocaleLowerCase() === value.toLocaleLowerCase())) { setListError('Ya tienes una lista con ese nombre.'); return; } onChange(old => ({ ...old, lists: [...old.lists, value] })); setNewList(''); setListError(''); }} style={[s.button, s.active]}><Text style={[s.buttonText, s.activeText]}>Crear</Text></Pressable></View>{!!listError && <Text accessibilityRole="alert" style={s.profileError}>{listError}</Text>}
  {shelf('Por ver', 'watchlist', 'Guarda lo que quieres ver después desde el detalle de cada título.')}
  {shelf('Mis calificaciones', 'rated', 'Tus calificaciones con estrellas aparecerán aquí.')}
  <Text style={s.sectionTitle}>Mis reseñas</Text>{entries.some(e => e.review?.trim()) ? entries.filter(e => e.review?.trim()).map(e => <Pressable accessibilityRole="button" key={`${e.title.type}_${e.title.id}`} style={s.review} onPress={() => onSelect(e.title)}><Text style={s.cardName}>{e.title.name} · {'★'.repeat(e.rating || 0)}</Text><Text style={s.text}>{e.review}</Text></Pressable>) : <Text style={s.shelfEmpty}>Cada historia deja algo. Escribe tu primera reseña desde un título.</Text>}
  <View style={s.accountSection}>{user ? <><Pressable accessibilityRole="button" onPress={onLogout} style={s.button}><Text style={s.buttonText}>Cerrar sesión</Text></Pressable><Pressable accessibilityRole="button" onPress={onDeleteAccount} style={s.button}><Text style={s.buttonText}>Eliminar mi cuenta</Text></Pressable></> : <Pressable accessibilityRole="button" onPress={onAccount} style={s.button}><Text style={s.buttonText}>Conectar mi cuenta</Text></Pressable>}</View>
  <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}><SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><Text style={[s.heading, { marginTop: 24 }]}>Editar perfil</Text><Text style={[s.muted, { marginVertical: 12 }]}>Dale tu toque a este espacio.</Text><View style={{ alignItems: 'center', gap: 12, marginVertical: 18 }}>{photo || user?.photoURL ? <Image source={{ uri: photo || user?.photoURL || '' }} style={s.profilePhoto} /> : <LinearAvatar initial="Y" />}<Pressable accessibilityRole="button" disabled={photoBusy} onPress={pickPhoto} style={s.button}><Text style={s.buttonText}>{photoBusy ? 'Preparando foto…' : 'Cambiar foto'}</Text></Pressable></View>{!!photoError && <Text style={s.profileError}>{photoError}</Text>}<Text style={s.sectionTitle}>Nombre</Text><TextInput accessibilityLabel="Nombre del perfil" style={s.input} value={name} onChangeText={setName} placeholder="Tu nombre" maxLength={50} /><Text style={s.sectionTitle}>Descripción</Text><TextInput accessibilityLabel="Descripción del perfil" style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} placeholder="Cuéntanos qué historias te gustan…" maxLength={240} multiline /><Text style={[s.muted, { marginTop: 8 }]}>{bio.length}/240</Text><Pressable accessibilityRole="button" disabled={!ready || photoBusy || !name.trim()} style={[s.button, s.active, (!name.trim() || photoBusy) && { opacity: 0.5 }]} onPress={() => { onChange(old => ({ ...old, profile: { ...old.profile, name: name.trim(), bio: bio.trim(), photoUri: photo, joinedAt: old.profile?.joinedAt || new Date().toISOString() } })); setEditing(false); }}><Text style={[s.buttonText, s.activeText]}>Guardar perfil</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={s.button}><Text style={s.buttonText}>Cancelar</Text></Pressable></ScrollView></SafeAreaView></Modal>
 </>;
}
function LinearAvatar({ initial }: { initial: string }) { return <View style={[s.profilePhoto, s.profilePhotoPlaceholder]}><Text style={s.profileInitial}>{initial}</Text></View>; }
